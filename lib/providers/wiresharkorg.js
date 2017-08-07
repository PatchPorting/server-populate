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


module.exports.name = 'code.wireshark.org (VCS)';


module.exports.desc = 'Patches found in code.wireshark.org. Original: ' +
                      'https://code.wireshark.org/review/gitweb?p=wireshark.git;a=commit;' +
                      'h=a83a324acdfc07a0ca8b65e6ebaba3374ab19c76. Generated: ' +
                      'https://code.wireshark.org/review/gitweb?p=wireshark.git;a=patch;' +
                      'h=a83a324acdfc07a0ca8b65e6ebaba3374ab19c76';


module.exports.match = str => utils.matchMulti(['code.wireshark.org', ';a=commit;'], str);


module.exports.massage = utils.commMass;
