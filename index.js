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

const utils = require('./lib/utils');
const inspectLine = require('./lib/inspectLine');
const server = require('server-http/server/server');


function exit(msg, err) {
  utils.log.error(msg, err);

  process.exit(1);
}


const dbg = utils.dbg(__filename);
// TODO: Add to the config file.
const baseFiles = {
  txt: {
    path: './dataFile.txt',
    url: 'svn://scm.alioth.debian.org/svn/secure-testing/data/CVE/list',
  },
  json: {
    path: './dataFile.json',
    url: 'https://security-tracker.debian.org/tracker/data/json',
  },
};
const providers = utils.requireDir(module, './lib/providers');
const providerFiles = Object.keys(providers);
const providerM = server.models.provider;


const populate = () => {
  const setupM = server.models.setup;
  const msgErr = 'Finding the default setup in DB';

  utils.log.info('Looking for the default setup in DB ...');

  // We want the last added one, the rest are kept for historical reasons.
  setupM.find({ where: { name: 'default' }, limit: 1, order: 'id DESC' })
  .then((setupDb) => {
    utils.log.info('Default setup correctly got from DB', setupDb[0]);
    const setupFound = setupDb[0];

    if (!setupFound) { exit(msgErr); }

    global.setupDefaultId = setupFound.id;
  })
  .catch(err => exit(msgErr, err));


  utils.log.info('(re) downloading the base files ...');

  Promise.all([
    utils.downBase(baseFiles.txt.url, baseFiles.txt.path),
    // TODO: To debug for now, drop eventually.
    // () => () => new Promise(),
    utils.downFile(baseFiles.json.url),
  ])
  .then((res) => {
    if (!res[1]) {
      utils.log.error(`Empty file from: ${baseFiles.json.url}`);
      process.exit(1);
    }

    utils.log.info('Base files are ready, parsing/reading now ...');

    let baseFileJson;
    try {
      baseFileJson = JSON.parse(res[1].toString());
    } catch (err) {
      utils.log.error('Parsing the base JSON file', err);
      process.exit(1);
    }

    utils.log.info('Base JSON file correctly parsed');

    // TODO: Use an iterator. In case a huge file the memory print could be too much.
    utils.fs.readFile(baseFiles.txt.path, { encoding: 'utf8' })
    .then((baseFileC) => {
      dbg('Base file correctly readed');
      const baseFileSplit = baseFileC.split('\n');
      dbg('Base file splitted:', baseFileSplit);

      // We could have new definitions.
      dbg('Adding the providers ...', providerFiles);

      // eslint-disable-next-line arrow-body-style
      const providersToAdd = utils.map(providerFiles, (fileName) => {
        return {
          name: providers[fileName].name,
          file: fileName,
          description: providers[fileName].desc,
        };
      });

      utils.pMap(
        providersToAdd,
        providerToAdd =>
          providerM.findOrCreate({ where: { file: providerToAdd.file } }, providerToAdd),
        // TODO: Review
        { concurrency: 10 }
      )
      .then((providersAdded) => {
        dbg('All providers properly added tro the DB, now parsing the file ...', providersAdded);

        // The result includes a boolean as second value for each position of the whole array.
        const providersWithId = utils.map(providersAdded, providerAdded => providerAdded[0]);

        utils.pMapSeries(
          baseFileSplit,
          line => inspectLine(line, providers, providersWithId, server.models, baseFileJson)
        )
        .then(() => {
          utils.log.info('Base file parsing finished correctly.');
        })
        .catch(err => exit('Parsing the base file', err));
      })
      .catch(err => exit(`Adding providers info for: "${JSON.stringify(providerFiles)}"`, err));
    })
    .catch(err => exit('Reading the file', err));
  })
  .catch(err => exit('Downloading the files', err));
};


populate();

// Re-run each 12 hours.
const interval = 12;

setInterval(populate, interval * 60 * 60 * 1000);
utils.log.info('Interval set');
