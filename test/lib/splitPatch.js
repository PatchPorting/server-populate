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

const path = require('path');
const fs = require('fs');

const test = require('tap').test; // eslint-disable-line import/no-extraneous-dependencies

const splitPatch = require('../../lib/splitPatch');
// const utils = require('../../lib/utils');


const artifactsPath = path.resolve(__dirname, '../artifacts');
const patchPath = path.resolve(artifactsPath, 'test.patch');
const patchPathLegacy = path.resolve(artifactsPath, 'legacy.patch');
const hunksPath = path.resolve(artifactsPath, 'hunks');
const total = fs.readdirSync(hunksPath).length;

test('should get hunks for a valid patch', (assert) => {
  assert.plan(1);

  // TODO: write the tests.
  splitPatch(patchPath, 111)
  .then((res) => {
    // utils.each(res, el => {
    //   console.log('FILENAME');
    //   console.log(el.fileName);
    //   console.log('DATA');
    //   console.log(el.data);
    // });
    assert.equal(res.length, total);
  });
});


test('should get hunks for a valid patch (ledacy format)', (assert) => {
  assert.plan(1);

  // TODO: write the tests.
  splitPatch(patchPathLegacy, 111)
  .then((res) => {
    // utils.each(res, el => {
    //   console.log('FILENAME');
    //   console.log(el.fileName);
    //   console.log('DATA');
    //   console.log(el.data);
    // });
    assert.equal(res.length, 1);
  });
});
