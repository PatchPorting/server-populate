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


module.exports.name = 'git.openssl.org (VCS)';


module.exports.desc = 'Patches found in git.openssl.org. Original: ' +
                      'https://git.openssl.org/gitweb/?p=openssl.git;a=commit;' +
                      'h=af58be768ebb690f78530f796e92b8ae5c9a4401. Generated: ' +
                      'https://git.openssl.org/gitweb/?p=openssl.git;a=patch;' +
                      'h=af58be768ebb690f78530f796e92b8ae5c9a4401';


module.exports.match = str => utils.matchMulti(['git.openssl.org', ';a=commit;'], str);


module.exports.massage = utils.commMass;
