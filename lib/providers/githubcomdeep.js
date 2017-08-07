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


const utils = require('../utils');
const githubProvider = require('./githubcom');


const dbg = utils.dbg(__filename);


module.exports.name = 'github.com (issues)';


module.exports.desc = 'Patches found in the issues section of this project in github.com. ' +
                      'Original: https://github.com/mdadams/jasper/issues/120' +
                      'Generated: ' +
                      'https://github.com/mdadams/jasper/commit/58ba0365d911b9f9dd68e9abf82' +
                      '6682c0b4f2293.patch';


module.exports.match = str => utils.matchMulti(['github.com', '/issues/'], str);

// TODO: Add a description in all providers and improve the naming.

module.exports.massage = str =>
  new Promise((resolve, reject) => {
    let ret = [];

    dbg(`Massage started for: ${str}`);

    utils.scrap.getLinks(str, 'div.edit-comment-hide > table > tbody > tr > td > p > a')
    .then((links) => {
      dbg('Discovered URL candidates:', links);
      if (!links || !utils.isArray(links) || utils.isEmpty(links)) {
        dbg('Empty links, skipping');
        resolve(ret);
        return;
      }

      // Series because we're adding sequantially into ret,
      // to avoid lose result.
      dbg('Checking and massaging them ...');
      utils.pMapSeries(
        links,
        link => new Promise((resolveLinks) => {
          dbg('- Turn for:', link);
          const linkR = link;

          // patch-display.php?bug_id=69090&patch=opcache_bug69090_user_id_keys&revision=latest
          if (linkR.url && githubProvider.match(linkR.url)) {
            dbg('Matched, massaging it ...');
            githubProvider.massage(linkR.url)
            .then((urls) => {
              dbg('Massaged URLs:', urls);
              ret = ret.concat(urls);
              dbg('New partial result:', ret);
              resolveLinks();
            })
            .catch((err) => {
              utils.log.error('Getting the urls with the original provider (massage)', err);
              // We don't want to stop the full chain.
              resolveLinks();
            });
          } else {
            dbg('NOT Matched');
            resolveLinks();
          }
        })
      )
      .then(() => {
        dbg('Done, result:', ret);
        resolve(ret);
      }).catch((err) => {
        utils.log.error('Getting the urls with the original provider (scrapping)', err);
        resolve();
      });
    })
    .catch(err => reject(err));
  });
