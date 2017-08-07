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

const meth = require('../../lib/getPatchesFromDeb');

const uriBase = 'http://security.debian.org/debian-security/pool/updates/main/';


test('should get the link valid patch for full a "tar.gz"', (assert) => {
  assert.plan(2);

  meth(`${uriBase}b/botan1.10/botan1.10_1.10.5-1+deb7u3.debian.tar.gz`, 'CVE-2016-9132')
  .then((res) => {
    assert.equal(res[0], 'botan1.10_1.10.5-1+deb7u3.debian.tar.gz/' +
                         'debian/patches/CVE-2016-9132.patch');
    assert.equal(res.length, 1);
  });
});


test('should get the link valid patch for full a "tar.bz2"', (assert) => {
  assert.plan(2);

  meth(`${uriBase}i/imagemagick/imagemagick_6.7.7.10-5+deb7u15.debian.tar.bz2`, 'CVE-2017-9500')
  .then((res) => {
    assert.equal(res[0], 'imagemagick_6.7.7.10-5+deb7u15.debian.tar.bz2/' +
                         'debian/patches/0219-CVE-2017-9500-Fix-denial-of-service-in-the-fun' +
                         'ction-ResetImageProfileIterator-via-crafted-file.patch');
    assert.ok(true);
  });
});
