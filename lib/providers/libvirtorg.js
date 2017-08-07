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


module.exports.name = 'libvirt.org/git (VCS)';


module.exports.desc = 'Patches found in libvirt.org/git. Original: ' +
                      'https://libvirt.org/git/?p=libvirt.git;a=commit;' +
                      'h=c5f6151390ff0a8e65014172bb8c0a8d312c3353. Generated: ' +
                      'https://libvirt.org/git/?p=libvirt.git;a=patch;' +
                      'h=c5f6151390ff0a8e65014172bb8c0a8d312c3353';


module.exports.match = str => utils.matchMulti(['libvirt.org/git/', ';a=commit;'], str);


module.exports.massage = utils.commMass;
