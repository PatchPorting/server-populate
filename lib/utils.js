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

// TODO: Push shared stuff with the HTTP server project to a GitHub repo.

const path = require('path');

// Lodash as base.
const utils = require('lodash');
const svn = require('node-svn-ultimate');
const cheerio = require('cheerio');
const rp = require('request-promise-native');
const debug = require('debug');
const promisify = require('es6-promisify');
const rimraf = require('rimraf');

const projectName = require('../package.json').name;


function pathToTag(fullPath) {
  const res = path.basename(fullPath, '.js');

  if (!res || res === fullPath) {
    throw new Error('Bad path');
  } else {
    return res;
  }
}


// Basis.

utils.dbg = fullPath => debug(`${projectName}:${pathToTag(fullPath)}`);

utils.validator = require('validator');


// File.
utils.fs = require('fs-extra');

utils.downFile = require('download');

// TODO: Change to async, not a big deal, only once at the start.
utils.requireDir = require('require-directory');

utils.pathToTag = pathToTag;

// rm -rf equivalent.
utils.rmDir = promisify(rimraf);


// Promises.

utils.pMap = require('p-map');

utils.pMapSeries = require('promise-map-series');

utils.promisify = promisify;

utils.pCheck = obj =>
  !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';


utils.downBase = (url, dst) =>
  new Promise((resolve, reject) => {
    // "force" needed to allow overwrite the old file (if present).
    svn.commands.export(url, dst, { force: true }, (err) => {
      if (err) {
        reject(err);

        return;
      }

      resolve();
    });
  });


utils.matchMulti = (substrs, str) => utils.every(substrs, (substr) => {
  const pos = str.search(substr);

  if (pos !== -1) { return true; }

  return false;
});


function getLinks(url, selector = 'a') {
  return new Promise((resolve, reject) => {
    const options = {
      uri: url,
      headers: ['Mozilla/5.0 (X11; Fedora; Linux x86_64)' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'],
      transform: body => cheerio.load(body),
    };

    rp(options)
    .then((ch) => {
      // TODO: Check why not to bruteforce all for every entry always?
      const links = ch(selector);

      const ret = [];
      ch(links).each((i, link) => {
        const text = ch(link).text();
        const url2 = ch(link).attr('href');

        if (!text || !url2) { return; }

        ret.push({ text, url: url2 });
      });

      resolve(ret);
    })
    .catch(err => reject(err));
  });
}

utils.scrap = { getLinks };


// For the most of the providers.
utils.commMass = (str) => {
  const res = [];

  if (str) { res.push(str.replace('commit', 'patch')); }

  return Promise.resolve(res);
};


// From here some helpers to print in Bluemix native logs and Monitoring and
// Analytics addon in a more or less comfortable way. Both don't support colors :(.
// TODO: Repeated code in the server-http project -> abstract or require
utils.log = {
  info: (msg, obj) => {
    /* eslint-disable no-console */
    console.log(`\n${msg || '-'}\n`);
    if (obj) { console.log(obj); }
  },
  error: (msg, err) => {
    console.error('\n---------- ERROR ----------\n');

    if (err) { console.error(err); }
    /* eslint-disable no-console */
  },
};

module.exports = utils;
