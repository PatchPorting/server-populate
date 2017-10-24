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

'use strict';

// Script with the same behaviour but the CVE file is not downloaded.
// This way we can include only a subset of the packages.
// TODO: Abstract the common parts with "inspectLine.js".

// process.env.VCAP_SERVICES = JSON.stringify({ paste: here });
// process.env.NODE_ENV = 'production';

const path = require('path');

// const sleep = require('sleep');

const utils = require('../lib/utils');
const server = require('server-http/server/server');
const getDebLink = require('../lib/getDebLink');
const createPatchset = require('../lib/createPatchset');
const getPatchesFromDeb = require('../lib/getPatchesFromDeb');

const pathPatches = path.resolve(__dirname, '../patches');


function exit(msg, err) {
  utils.log.error(msg, err);

  process.exit(1);
}


const cveM = server.models.cve;


utils.log.info('Downloading the base file ...');


utils.downFile('https://security-tracker.debian.org/tracker/data/json')
.then((res) => {
  if (!res) {
    utils.log.error('Empty base file');
    process.exit(1);
  }

  utils.log.info('Base file ready, parsing now ...');

  let pkgsInfo;
  try {
    pkgsInfo = JSON.parse(res.toString());
  } catch (err) {
    utils.log.error('Parsing the base JSON file', err);
    process.exit(1);
  }

  utils.log.info('Base JSON file correctly parsed');

  utils.log.info('Getting CVE/pkg combinations ...');
  cveM.find({
    where: { packages: { ne: [] } },
    // To run for an specific CVE.
    // where: { name: 'CVE-2017-9735' },
    fields: { name: true, packages: true, id: true },
  })
  .then((cves) => {
    utils.log.info('CVEs info found', { total: cves.length });

    const combinations = [];

    utils.each(cves, (infoCve) => {
      utils.each(infoCve.packages, (infoPkg) => {
        combinations.push({
          id: infoCve.id,
          cve: infoCve.name,
          pkg: infoPkg.name,
          packages: infoCve.packages,
        });
      });
    });

    utils.log.info('combination.cve/pkg combinations found', combinations);

    const relasesOrder = ['wheezy', 'buster', 'jessie', 'strech'];

    const resolveComb = combination =>
      new Promise((resolve) => {
        utils.log.info('Checking if any other Debian release already includes' +
            ' packages with a patch for', combination);

        let release;

        // pkgsInfo['botan1.10']['CVE-2016-9132'])
        if (pkgsInfo[combination.pkg] && pkgsInfo[combination.pkg][combination.cve] &&
            pkgsInfo[combination.pkg][combination.cve].releases) {
          const releasesInfo = pkgsInfo[combination.pkg][combination.cve].releases;

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
          utils.log.info('No patch found in any Debian release for', combination);
          resolve();
          return;
        }

        utils.log.info('Fix found, getting the link to Debian package', {
          pkg: combination.pkg,
          release,
        });

        // sleep.sleep(3);
        getDebLink(release, combination.pkg)
        .then((linkPkg) => {
          utils.log.info('Link found', { linkPkg });

          if (!linkPkg) {
            // We only notify and doesn't reject to avoid breaking the full chain.
            utils.log.info('Empty link to Debian package, skipping ...');
            resolve();
            return;
          }

          utils.log.info('Getting patches from Debian package', { linkPkg });

          getPatchesFromDeb(linkPkg, combination.cve)
          .then((patchUris) => {
            utils.log.info('Patches found, creating patchset', patchUris);

            if (utils.isEmpty(patchUris)) {
              // We only notify and doesn't reject to avoid breaking the full chain.
              utils.log.info('Empty patch URIs, skipping ...');
              resolve();
              return;
            }

            const debFileName = linkPkg.split('/').slice(-1)[0];
            const tmpPath = path.resolve(pathPatches, debFileName);

            createPatchset(combination.id, combination.cve, patchUris, release, linkPkg,
                          null, server.models, combination.packages, pkgsInfo, tmpPath)
            .then(() => {
              utils.log.info('Patchset and its related data corrrectly created');

              // We need to wait to drop the package because it's stored in the fs
              // from the step before.
              utils.log.info('Dropping the used package from the fs', { tmpPath });

              utils.rmDir(tmpPath)
              .then(() => {
                utils.log.info('Package correctly removed');
                resolve();
              })
              .catch((err2) => {
                utils.log.error('Removing downloaded package', err2);

                resolve();
              });
            })
            .catch((err) => {
              utils.log.error('Creating the patchset', err);

              utils.log.info('Dropping the errored package from the fs', { tmpPath });

              utils.rmDir(tmpPath)
              .then(() => {
                utils.log.error('Package correctly removed');
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
      });

    utils.pMapSeries(combinations, resolveComb)
    .then(() => utils.log.info('\nDone :)'))
    .catch(err => exit('Mapping', err));
  })
  .catch(err => exit('Getting the combination.cve/pkg combinations', err));
})
.catch(err => exit('Downloading the base file', err));
