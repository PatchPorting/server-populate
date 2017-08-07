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


module.exports.name = 'git.qemu.org (VCS)';


module.exports.desc = 'Patches found in git.qemu.org. Original: ' +
                      'http://git.qemu.org/?p=qemu.git;a=commit;' +
                      'h=e23d04984a78490d8aaa5c45724a3a334933331f. Generated: ' +
                      'http://git.qemu.org/?p=qemu.git;a=patch;' +
                      'h=e23d04984a78490d8aaa5c45724a3a334933331f';


module.exports.match = str => utils.matchMulti(['git.qemu.org', ';a=commit;'], str);


module.exports.massage = utils.commMass;
