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

const sleep = require('sleep');

const utils = require('./utils');
const getDebLink = require('./getDebLink');
const createPatchset = require('./createPatchset');
const getPatchesFromDeb = require('./getPatchesFromDeb');


const pathPatches = path.resolve(__dirname, '../patches');
const dbg = utils.dbg(__filename);
// To reuse and avoid not needed DB requests.
let lastCveInstance;
let packages;
let releases;
let cveName;


module.exports = (line, providers, dataProvsWithId, models, pkgsInfo) =>
  new Promise((resolve, reject) => {
    dbg(`New line to inspect: ${line}`);

    if (line[0] === 'C' && line[1] === 'V' &&
        line[2] === 'E' && line[3] === '-') {
      dbg(`New CVE line found: ${line}`);
      const split = line.split(' ');
      packages = [];
      releases = [];
      cveName = split[0].trim();

      // New CVE -> reset the references.
      const toAdd = { name: cveName, packages: [], releases: [] };
      if (split[1]) { toAdd.description = split.slice(1).join(' ').trim().slice(1, -1); }

      dbg('Creating it if not present in DB ...', toAdd);
      models.cve.create(toAdd)
      .then((resCve) => {
        lastCveInstance = resCve;
        dbg(`New CVE entry correctly added, ID: ${lastCveInstance.id}`);
        resolve();
      })
      .catch((err) => {
        // Do not parse and download anything else until a valid one is found.
        lastCveInstance = null;

        // This also cover the cases that
        if (err.statusCode === 422) {
          dbg(`Already parsed CVE entry found: ${toAdd.name}`);
        } else {
          utils.log.error(`Creating the CVE entry: ${JSON.stringify(toAdd)}`, err);
        }

        resolve();
      });

      return;
    }

    if (lastCveInstance &&
        line[0] === '\t' && line[1] === '-' && line[2] === ' ') {
      dbg(`New " -*" line found: ${line}`);

      const split = line.split(' ');

      // ie:
      // - ppmd <removed> (low; bug #775218)
      // - spamassassin 3.1.7-2 (bug #410843)
      if (!split[1]) {
        resolve();
        return;
      }

      const pkgInfo = { name: split[1].trim() };

      if (split[2]) { pkgInfo.versionFixed = split[2].trim(); }

      // ie:
      // (low; bug #775218)
      // (bug #417862; medium)
      // (bug #410338; medium; bug #410552)
      // (bug #409703; unimportant)
      // (bug #402316; low)
      // (low; bug #318728)
      // (low)
      const rest = split.slice(3).join(' ');

      if (rest) {
        pkgInfo.bug = {};
        let risk;
        const ids = [];

        const noparens = rest.slice(1, -1);
        const splitRisk = noparens.split(';');

        utils.each(splitRisk, (part) => {
          const trimmed = part.trim();

          if (trimmed[0] === 'b' && trimmed[1] === 'u' && trimmed[2] === 'g' &&
            trimmed[3] === ' ' && trimmed[4] === '#') {
            const id = trimmed.split('#')[1];

            if (id) { ids.push(id); }
          } else {
            risk = trimmed;
          }
        });

        if (risk) { pkgInfo.bug.risk = risk; }
        if (!utils.isEmpty(ids)) { pkgInfo.bug.ids = ids; }
      }

      dbg('New info about a package found, adding to the last CVE ...', {
        lastCveInstance,
        pkgInfo,
      });

      lastCveInstance.updateAttributes({ $addToSet: { packages: pkgInfo } })
      // TODO: This is not updated! But it's in DB. We use "packages" and
      // "releases" to store the same.
      .then(() => {
        packages.push(pkgInfo);

        dbg(`New package info added to the proper CVE entry, ID: ${lastCveInstance.id}`);

        dbg('Checking if any other Debian release already includes packages with a patch', {
          pkgName: lastCveInstance.name,
          cveName,
        });

        // To get the older one to get the less number of possible patches.
        // TODO: Confirm the fist one is the old stable (wheezy vs sid)
        // -> use "utils.findLast" in this case.
        // old stable, stable, testing, unstable
        // TODO: Abstract this in a file to setup the actual relases.
        const relasesOrder = ['wheezy', 'buster', 'jessie', 'strech'];
        let release;

        // pkgsInfo['botan1.10']['CVE-2016-9132'])
        if (pkgsInfo[pkgInfo.name] && pkgsInfo[pkgInfo.name][cveName] &&
            pkgsInfo[pkgInfo.name][cveName].releases) {
          const releasesInfo = pkgsInfo[pkgInfo.name][cveName].releases;

          // TODO: Refactor this in a functional way.
          for (let i = 0; i < relasesOrder.length; i += 1) {
            if (releasesInfo[relasesOrder[i]] && releasesInfo[relasesOrder[i]].fixed_version) {
              release = relasesOrder[i];
              break;
            }
          }
        }

        if (!release) {
          // We only notify and doesn't reject to avoid breaking the full chain.
          dbg('No ready patch found in any Debian release');
          resolve();
          return;
        }

        dbg('Fix found, getting the link to Debian package', { pkg: pkgInfo.name, release });

        // TODO: Trick to try to avoid being blocked because we're scrapping Debian site here.
        sleep.sleep(10);

        getDebLink(release, pkgInfo.name)
        .then((linkPkg) => {
          dbg('Link found', { linkPkg });

          if (!linkPkg) {
            // We only notify and doesn't reject to avoid breaking the full chain.
            dbg('Empty link to Debian package, skipping ...');
            resolve();
            return;
          }

          dbg('Getting patches from Debian package', { linkPkg });

          getPatchesFromDeb(linkPkg, cveName)
          .then((patchUris) => {
            dbg('Patches found, creating patchset', patchUris);
            // if (utils.isEmpty(patchesUri))

            if (utils.isEmpty(patchUris)) {
              // We only notify and doesn't reject to avoid breaking the full chain.
              dbg('Empty patch URIs, skipping ...');
              resolve();
              return;
            }

            const debFileName = linkPkg.split('/').slice(-1)[0];
            const tmpPath = path.resolve(pathPatches, debFileName);

            // TODO: Confirm "tmpPath" not being used and drop it.
            createPatchset(lastCveInstance.id, cveName, patchUris, release,
                          linkPkg, null, models, packages, pkgsInfo, tmpPath)
            .then(() => {
              dbg(`Patchset and its related data corrrectly created (${release})`);

              // We need to wait to drop the package because it's stored in the fs
              // from the step before.
              dbg('Dropping the used package from the fs', { tmpPath });

              utils.rmDir(tmpPath)
              .then(() => {
                dbg('Package correctly removed');
                resolve();
              })
              .catch((err2) => {
                utils.log.error('Removing donwloaded package', err2);

                resolve();
              });
            })
            .catch((err) => {
              utils.log.error('Creating the patchset', err);

              dbg('Dropping the errored package from the fs', { tmpPath });

              utils.rmDir(tmpPath)
              .then(() => {
                dbg('Package correctly removed');
                resolve();
              })
              .catch((err2) => {
                utils.log.error('Removing donwloaded package', err2);

                resolve();
              });
            });
          })
          .catch((err) => {
            utils.log.error('Getting the patches', err);
            resolve();
          });
        }).catch((err) => {
          utils.log.error('Getting the link to the Debian package', err);
          resolve();
        });
      })
      .catch((err) => {
        utils.log.error(`Adding the package info to the CVE entry: ${lastCveInstance.id}}`, err);
        resolve();
      });

      return;
    }


    // Getting patches using the providers

    // [wheezy] - nova <not-affected> (Affected code not present)
    // [wheezy] - subversion <no-dsa> (Minor issue, PID file not created by default)
    // [wheezy] - lcms 1.19.dfsg2-1.2+deb7u1
    // [wheezy] - linux <not-affected> (Introduced in 3.8)
    // [jessie] - chromium-browser 45.0.2454.85-1~deb8u1
    // [squeeze] - chromium-browser <end-of-life>
    // [experimental] - srtp 1.5.3~dfsg-1
    if (lastCveInstance && line[0] === '\t' && line[1] === '[') {
      const split = line.split(' ');
      const release = split[0].slice(2, -1);

      if (!release) {
        resolve();
        return;
      }
      // Package name is always present.
      const resPart = { release, package: split[2] };

      if (split[3]) { resPart.versionFixed = split[3]; }
      if (split[4]) { resPart.note = split.slice(4).join(' ').slice(1, -1); }

      dbg(
        'New info about a package release found, adding to the last CVE ...',
        resPart
      );
      lastCveInstance.updateAttributes({ $addToSet: { releases: resPart } })
      .then(() => {
        releases.push(resPart);

        dbg(`New package relase info added to the proper CVE entry, ID: ${lastCveInstance.id}`);
        resolve();
      })
      .catch((err) => {
        utils.log.error(
          `Adding the package relase info to the CVE entry: ${lastCveInstance.id}}`,
          err
        );
        resolve();
      });

      return;
    }

    // From here parsing only "NOTE ...".
    if (!lastCveInstance ||
        line[0] !== '\t' || line[1] !== 'N' || line[2] !== 'O' ||
        line[3] !== 'T' || line[4] !== 'E') {
      resolve();
      return;
    }

    dbg(`New note line found: ${line}`);

    let links = line.substring(7).split(' ');

    if (!links || utils.isEmpty(links)) {
      dbg('No links found in this note');
      resolve();
      return;
    }

    links = utils.filter(links, lnk => utils.validator.isURL(lnk.trim(), {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      require_host: true,
    }));

    // TODO: Capture all, for now we're only getting one in each case.
    let link = links[0];
    if (!link) {
      resolve();
      return;
    }

    dbg(`New URL found: ${link}`);

    // Sometimes the url includes a "/" at the end and we don't
    // want it because sometimes we need to add stuff to the end.
    // ie: Github url -> url.patch
    if (link.slice(-1) === '/') { link = link.slice(0, -1); }

    // Dirty trick to debug.
    // const providers2 = { phpnet: require('./lib/providers/phpnet') };

    // Selecting the first matched provider.
    const provMatch = utils.find(
      dataProvsWithId,
      dataProvWithId => providers[dataProvWithId.file].match(link)
    );

    if (!provMatch || !provMatch.id || !provMatch.name || !provMatch.file) {
      resolve();
      return;
    }

    if (!providers[provMatch.file].massage) {
      reject(new Error('Impl. error, "massage" method not found' +
                      ` for selected provider: ${provMatch.file}`));

      return;
    }

    dbg('Getting the links to the patches ...');

    // Sometimes we need promises here, ie: extra scrapping.
    // so we return the method instead.
    providers[provMatch.file].massage(link)
    .then((urls) => {
      dbg(`Patch links found (link: ${link}): ${urls.length} ...`);

      if (utils.isEmpty(urls)) {
        // We only notify and doesn't reject to avoid breaking the full chain.
        dbg('Empty urls, skipping ...');
        resolve();
        return;
      }

      createPatchset(
        lastCveInstance.id, cveName, urls, 'notes', link, provMatch.id, models, packages, pkgsInfo
      )
      .then(() => {
        dbg('Patchset and its related data corrrectly created (notes)');
        resolve();
      }).catch((err) => {
        utils.log.error('Getting the patches', err);
        resolve();
      });
    })
    .catch((err) => {
      utils.log.error('Getting the link to the patches', err);
      resolve();
    });
  });
