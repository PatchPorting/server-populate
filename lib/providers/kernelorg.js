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


module.exports.name = 'git.kernel.org (VCS)';


module.exports.desc = 'Patches found in git.kernel.org. Original: ' +
                      'http://git.kernel.org/?p=linux/kernel/git/torvalds/linux-2.6.git;a=commit;' +
                      'h=96a2d41a3e495734b63bff4e5dd0112741b93b38. Generated: ' +
                      'http://git.kernel.org/?p=linux/kernel/git/torvalds/linux-2.6.git;a=patch;' +
                      'h=96a2d41a3e495734b63bff4e5dd0112741b93b38';


module.exports.match = str => utils.matchMulti(['git.kernel.org', ';a=commit;'], str);


module.exports.massage = utils.commMass;
