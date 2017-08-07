/*
  Copyright (c) 2017 IBM Corp.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*/

// TODO: Refactor this huge file.

'use strict';

const path = require('path');
const fs = require('fs');

const utils = require('./utils');
const splitPatch = require('./splitPatch');


const dbg = utils.dbg(__filename);
const pathPatches = path.resolve(__dirname, '../patches');


function downPatch(url, toPath) {
  return new Promise((resolve, reject) => {
    utils.downFile(url)
    .then((dataPatch) => {
      if (!dataPatch) {
        reject(new Error(`Empty file from: ${url}`));

        return;
      }

      // TODO:
      // - Do async.
      // - Parse the stream directly instead creating a file.
      try {
        fs.writeFileSync(toPath, dataPatch);
        resolve();
      } catch (err) {
        reject(err);
      }
    })
    .catch(err => reject(err));
  });
}


function createBuilds(packages, pkgsInfo, cveName, resSet, hunksBuild, models) {
  // TODO: Create all at once instead use .map
  return utils.pMap(
    packages,
    (info) => {
      // Do nothing.
      if (!pkgsInfo[info.name] || !pkgsInfo[info.name][cveName]) {
        return Promise.resolve();
      }

      const cveInfo = pkgsInfo[info.name][cveName];

      dbg('Creating a build with found hunks ' +
          'for each package affected by this CVE', cveInfo);


      if (!cveInfo.releases || utils.isEmpty(cveInfo.releases)) {
        return Promise.resolve();
      }

      const toAdd = [];

      // TODO: use map al filter instead.
      utils.each(Object.keys(cveInfo.releases), (releaseName) => {
        if (cveInfo.releases[releaseName] && cveInfo.releases[releaseName].status &&
            cveInfo.releases[releaseName].status === 'open') {
          toAdd.push({
            pkgVersion: cveInfo.releases[releaseName].repositories[releaseName],
            dist: releaseName,
            cveIds: [resSet.cveId],
            // Redundant, for client covenience.
            // - we should have only the IDs here and a relation.
            hunks: hunksBuild,
            // - could be derived from the hunk IDs.
            pkgName: info.name,
          });
        }
      });

      return models.build.create(toAdd);
    },
    // TODO: Add to a setup file.
    { concurrency: 5 }
  );
}


function createPatch(url, link, patchsetId, models, origin, cveId) {
  return new Promise((resolve, reject) => {
    // TODO: Rename, for now we use the combination of the package name and CVE name
    // as link because it's a unique key in the model.
    const patchInfo = { url, link, patchsetId };
    dbg('Turn for', patchInfo);

    models.patch.create(patchInfo)
    .then((patchData) => {
      dbg('New patch properly added to the DB', patchData);

      dbg('Starting patch download and hunk division ...');
      const idStr = patchsetId.toString();
      let tempFilePath;
      let downFinal = downPatch;

      if (/http/.test(patchData.url)) {
        tempFilePath = path.resolve(pathPatches, `${idStr}.patch`);
      } else {
        // For patches coming from Debian release we have them already in disk,
        // so we keep their file name and they are not downloaded.
        tempFilePath = path.resolve(pathPatches, patchData.url);
        downFinal = () => Promise.resolve();
      }

      dbg(`Starting file download: ${patchData.url} ...`);

      downFinal(patchData.url, tempFilePath)
      .then(() => {
        dbg(`- File correctly downloaded to: ${tempFilePath}`);

        splitPatch(tempFilePath)
        .then((hunksAll) => {
          // TODO: Not needed when we use a stream (see upper lines).
          dbg('Removing temp file ...');
          if (origin === 'notes') {
            try {
              utils.fs.removeSync(tempFilePath);
            } catch (err) {
              utils.log.error(`Removing the temp file: ${tempFilePath}`, err);
            }
          }

          // Sometime they come as undefined (compact)
          const hunks = utils.compact(hunksAll);
          dbg('Discovered hunks', { total: hunksAll.length });

          if (!hunks || (utils.isArray(hunks) && utils.isEmpty(hunks))) {
            // TODO: This is not an error but we log them in order to improve the patch splitter.
            utils.log.info('No Hunks for patch', patchData);
            resolve();
            return;
          }

          dbg(`Massaging hunks for ${patchData.id}`, {
            total: hunks.length,
          });
          const hunksMassaged = [];

          utils.each(hunks, (hunk) => {
            const massaged = hunk;

            massaged.cveId = cveId;
            massaged.patchsetId = patchsetId;
            massaged.patchId = patchData.id;

            hunksMassaged.push(massaged);
          });

          dbg(`Adding hunks to the DB for path ${patchData.id}`, {
            total: hunksMassaged.length,
          });

          models.hunk.create(hunksMassaged, (errH, resH) => {
            if (errH) {
              reject(new Error('Adding hunk info', errH[0][0]));

              // We don't create the build if this failed because
              // the hunks are not going to be ready to use.
              return;
            }

            // eslint-disable-next-line arrow-body-style
            const hunksPatch = utils.map(resH, (hunk) => { return { id: hunk.id }; });

            resolve(hunksPatch);
          });
        })
        .catch((errSplit) => {
          // TODO: Not needed when we use a stream (see upper lines).
          dbg('Removing temp file ...');
          if (origin === 'notes') {
            try {
              utils.fs.removeSync(tempFilePath);
            } catch (err3) {
              utils.log.error(`Removing the temp file: ${tempFilePath}`, err3);
            }
          }

          reject(new Error(`Splitting into hunks: ${tempFilePath}`, errSplit));
        });
      })
      .catch(errDown => reject(new Error(`Downloading the patch: ${patchData.url}`, errDown)));
    })
    .catch((err) => {
      // 422 due to the unique index, so it's expected.
      if (!err.statusCode || err.statusCode !== 422) {
        utils.log.error('Saving the patches in DB', err);
        reject(err);
        return;
      }

      dbg('Patch already in DB, referencing it ...');

      // We use "url" because it's unique.
      models.patch.findOne({ where: { url }, fields: { id: true } })
      .then((patchData) => {
        if (!patchData || !patchData.id) {
          reject(new Error('Should never be reached'));
          return;
        }

        dbg('Getting the hunks in DB for this patch', patchData);
        models.hunk.find({ where: { patchId: patchData.id }, fields: { id: true } })
        .then((hunksPatch) => {
          dbg('Hunks gotten', hunksPatch);
          resolve(hunksPatch);
        })
        .catch((errRef) => {
          utils.log.error('Gettign references', err);
          reject(errRef);
        });
      })
      .catch((errRef) => {
        utils.log.error('Gettign references', err);
        reject(errRef);
      });
    });
  });
}


// TODO: Refactor, too much params
// eslint-disable-next-line max-len
module.exports = (cveId, cveName, patchesUris, origin, link, providerId, models, packages, pkgsInfo) =>
  new Promise((resolve, reject) => {
    const newSet = { origin, cveId };

    if (providerId) { newSet.providerId = providerId; }

    dbg('Adding a new patch set with these new patches', newSet);
    models.patchset.create(newSet)
    .then((resSet) => {
      dbg('New patchset added, adding patches now ...', { patchesUris });

      // Series because they could be repeated and we wan't a break in
      // this case due to the unique index in the "url" field.
      // TODO: Filter and create at the same time without map.
      utils.pMapSeries(
        patchesUris,
        url => createPatch(url, link, resSet.id, models, origin, cveId)
      )
      .then((hunksFound) => {
        // It comes as array of arrays (in case of multiple patches for the patchset).
        const hunksBuild = utils.flatten(hunksFound);

        if (!hunksBuild || utils.isEmpty(hunksBuild) || utils.isEmpty(hunksBuild[0])) {
          // TODO: This is not an error but we log them in order to improve the providers.
          utils.log.info('Empty hunks for patchset', resSet);
          resolve();
          return;
        }

        dbg('Creating a build with found hunks, checking if a new build is needed ...');
        createBuilds(packages, pkgsInfo, cveName, resSet, hunksBuild, models)
        .then(() => {
          dbg('New builds correctly created');
          resolve();
        })
        .catch(err => reject(err));
      })
      .catch(err => reject(err));
    })
    .catch(err => reject(err));
  });
