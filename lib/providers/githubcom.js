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


module.exports.name = 'github.com (VCS)';


module.exports.desc = 'Patches found in github.com. Original: ' +
                      'https://github.com/ImageMagick/ImageMagick/commit/0a80c9e5f293a' +
                      '8de51011ac784ac52b96932c08f. Generated: ' +
                      'https://github.com/ImageMagick/ImageMagick/commit/0a80c9e5f293a' +
                      '8de51011ac784ac52b96932c08f.patch';


module.exports.match = str => utils.matchMulti(['github.com', '/commit/'], str);


module.exports.massage = str =>
  new Promise((resolve) => {
    const res = [];
    let massStr = str;

    // Sometimes they already include the patch link directly.
    // https://github.com/smarty-php/smarty/commit/279bdbd3521cd717cae6a3ba48f1c3c6823f439d.patch
    if (massStr.slice(-6) === '.patch') {
      res.push(massStr);
    } else {
      // ie: https://github.com/m6w6/ext-http/commit/3724cd76a28be1d6049b5537232e97ac567ae1f5/def
      if (massStr.slice(-4) === '/def') { massStr = massStr.slice(0, -4); }

      // Sometimes they include the link to the "diff" instead the commit, ie:
      // 'https://github.com/vadz/libtiff/commit/83a4b92815ea04969d4944
      // 16eaae3d4c6b338e4a#diff-c8b4b355f9b5c06d585b23138e1c185f'
      if (massStr.split('#')[0]) { res.push(`${massStr.split('#')[0]}.patch`); }
    }
    resolve(res);
  });
