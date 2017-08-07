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


module.exports.name = 'git.php.net (VCS)';


module.exports.desc = 'Patches found in git.php.net. Original: ' +
                      'http://git.php.net/?p=php-src.git;a=commit;h=73cabfedf519298e1a' +
                      '11192699f44d53c529315e. Generated: ' +
                      'http://git.php.net/?p=php-src.git;a=patch;h=73cabfedf519298e1a' +
                      '11192699f44d53c529315e';


module.exports.match = str => utils.matchMulti(['git.php.net', ';a=commit;'], str);


module.exports.massage = utils.commMass;
