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

const fs = require('fs');
const path = require('path');
// const util = require('util');

const decompress = require('decompress');

const utils = require('./utils');

const pathPatches = path.resolve(__dirname, '../patches');
const dbg = utils.dbg(__filename);


module.exports = (debUri, cveName) =>
  new Promise((resolve, reject) => {
    // const tempFilePath = path.resolve(pathPatches, `${idStr}.patch`);
    const debFileName = debUri.split('/').slice(-1)[0];
    const tmpPath = path.resolve(pathPatches, debFileName);
    const debFilePath = path.resolve(tmpPath, debFileName);

    dbg(`Starting file download: ${debUri} ...`);
    utils.downFile(debUri)
    .then((debData) => {
      if (!debData) {
        reject(new Error(`Empty file from: ${debUri}`));

        return;
      }

      // TODO:
      // - Make async!
      // - Abstract common parts from "getHunks"
      dbg(`Creating temp folder: ${tmpPath}`);
      try {
        fs.mkdirSync(tmpPath);
      } catch (err) {
        reject(err);

        return;
      }

      try {
        fs.writeFileSync(debFilePath, debData);
      } catch (err) {
        reject(err);

        return;
      }

      dbg(`- File correctly downloaded to: ${debFileName}, extracting the patches now it now ...`);

      // TODO: Use streams.
      decompress(debFilePath, tmpPath, {
        filter: file => /debian\/patches/.test(file.path) &&
                        // We only match the CVE number (without "CVE-YEAR")
                        // because the origin is not too consistent.
                        new RegExp(cveName.split('-')[2]).test(file.path) &&
                        path.extname(file.path) === '.patch',
      })
      .then((patchesInfo) => {
        const res = utils.map(patchesInfo, patchInfo => `${debFileName}/${patchInfo.path}`);

        if (utils.isEmpty(res)) {
          dbg('Dropping the errored package form the fs', { tmpPath });
          utils.rmDir(tmpPath)
          .then(() => dbg('Package correctly removed'))
          .catch(err2 => utils.log.error('Removing donwloaded package', err2));
        }

        resolve(res);
      })
      .catch((err) => {
        dbg('Dropping the errored package form the fs', { tmpPath });
        utils.rmDir(tmpPath)
        .then(() => dbg('Package correctly removed'))
        .catch(err2 => utils.log.error('Removing donwloaded package', err2));

        reject(err);
      });
    })
    .catch(err => reject(err));
  });
