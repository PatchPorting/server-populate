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

// TODO: Publish as a library.

const LineByLineReader = require('line-by-line');

const utils = require('./utils');


const dbg = utils.dbg(__filename);


function getFileName(line) {
  return line.split(' ')[1].split(':')[0].slice(2);
}


module.exports = filePath =>
  new Promise((resolve, reject) => {
    const hunks = [];
    let legacy = false;
    let newHunk;
    let header = '';
    let moreHeader = 0;
    let fileName;

    if (!filePath) {
      reject(new Error('A file path is required'));
      return;
    }

    const lr = new LineByLineReader(filePath);

    lr
      .on('line', (line) => {
        dbg(`New line: ${line}`);

        // ie: "Index: contrib.xml""
        if (/^Index: .*/.test(line)) {
          dbg('New file found (legacy format)');
          legacy = true;

          fileName = getFileName(line);
          dbg(`File name: ${fileName}`);

          header = line;
          // Remaining 3 lines of header, ie:
          // ===================================================================
          // RCS file: /home/cvspublic/cocoon-2.0/src/documentation/xdocs/contrib.xml,v
          // retrieving revision 1.7
          moreHeader = 3;

        // ie:  "--- a/libyara/lexer.c"
        } else if (/--- .*/.test(line) && !legacy) {
          dbg('New file found');

          fileName = getFileName(line);
          dbg(`File name: ${fileName}`);

          header = line;
          // Next line is header too, ie:
          // +++ b/libyara/lexer.c
          moreHeader = 1;

        // Hunk content, ie:
        // @@ -3252,6 +3252,7 @@ int yr_lex_parse_rules_fd(
        // ...
        // @@ -3264,8 +3265,6 @@ int yr_lex_parse_rules_fd(
        } else if (/@@ .* @@/.test(line)) {
          dbg('Hunk start mark');
          if (newHunk) {
            dbg('Adding the new hunk:', newHunk);
            hunks.push(newHunk);
          }

          newHunk = {
            fileName: fileName || 'not_found',
            data: `${header}\n${line}`,
          };
        // Getting the rest of the header depending on the format.
        } else if (moreHeader > 0) {
          header = `${header}\n${line}`;
          moreHeader -= 1;
          dbg('New line added to the header:', { line, newHeader: header });
          dbg(`New header: ${header}`);

        // Getting the code of each hunk.
        } else if (newHunk && newHunk.data) {
          dbg('New hunk data:', newHunk.data);
          newHunk.data = `${newHunk.data}\n${line}`;
        }
      })
      .on('end', () => {
        if (newHunk && newHunk.data) {
          dbg('Adding the last hunk:', newHunk);
          hunks.push(newHunk);
        }
        resolve(hunks);
      })
      .on('error', err => reject(err));
  });
