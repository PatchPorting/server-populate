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


module.exports.name = 'bugs.php.net';


module.exports.desc = 'Patches found in bugs.php.net. Original: ' +
                      'https://bugs.php.net/bug.php?id=74435. ' +
                      'Generated: https://bugs.php.net/patch-display.php?bug_id=74435&' +
                      'patch=fix-74435-php-7.0&revision=latest&download=1';


module.exports.match = str => utils.matchMulti(['bugs.php.net'], str);


module.exports.massage = str =>
  new Promise((resolve, reject) => {
    const ret = [];

    utils.scrap.getLinks(str, '.content > a')
    .then((links) => {
      utils.each(links, (link) => {
        const linkR = link;
        let url;

        // patch-display.php?bug_id=69090&patch=opcache_bug69090_user_id_keys&revision=latest
        if (linkR && linkR.url && utils.matchMulti(['patch-display'], linkR.url)) {
          // Sometimes they come without the protocol.
          if (linkR.url[0] !== 'h' || linkR.url[1] !== 't' ||
              linkR.url[2] !== 't' || linkR.url[3] !== 'p') {
            url = `https://bugs.php.net/${linkR.url}`;
          }
          ret.push(`${url}&download=1`);
        }
      });

      resolve(ret);
    })
    .catch(err => reject(err));
  });
