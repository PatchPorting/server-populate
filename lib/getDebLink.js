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


const utils = require('./utils');

const baseUri = 'https://packages.debian.org/source/';


module.exports = (release, name) =>
  new Promise((resolve, reject) => {
    const uri = `${baseUri}${release}/${name}`;

    utils.scrap.getLinks(uri, '#pdownload > table > tr > td > a')
    .then((links) => {
      let valid = null;

      utils.each(links, (link) => {
        if (link && link.url) {
          if (utils.matchMulti([name, 'debian.tar.bz2'], link.url)) {
            valid = link.url;
          } else if (utils.matchMulti([name, 'debian.tar.gz'], link.url)) {
            valid = link.url;
          }
        }
      });

      resolve(valid);
    })
    .catch(err => reject(err));
  });
