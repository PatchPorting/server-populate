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

const test = require('tap').test; // eslint-disable-line import/no-extraneous-dependencies

const provider = require('../../../lib/providers/githubcomdeep');

const link = 'https://github.com/ivmai/bdwgc/issues/135';


test('should match for a valid link', (assert) => {
  assert.plan(1);

  assert.ok(provider.match(link));
});


test('should not match for a not valid link', (assert) => {
  assert.plan(2);

  assert.notOk(provider.match(link.replace('github', 'ibm')));
  assert.notOk(provider.match(
    'https://github.com/ImageMagick/ImageMagick/commit/f983dcdf9c178e0cbc49608a78713c5669aa1bb5'
  ));
});


test('should massage a link properly', (assert) => {
  assert.plan(1);

  provider.massage(link)
  .then(res => assert.equal(
    res[0],
    'https://github.com/ivmai/bdwgc/commit/4e1a6f9d8f2a49403bbd00b8c8e5324048fb84d4.patch'
  ));
});
