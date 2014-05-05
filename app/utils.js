const
  fs = require('fs'),
  path = require('path'),
  ncp = require('ncp'),
  moment = require('moment'),
  _ = require('lodash'),
  Promise = require('bluebird');

/**
 * Recursively walk through a directory
 * and return a list of files
 */
function walk(dir, done) {
  'use strict';
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.join(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function isMarkdownFile(filePath) {
  'use strict';
  return /.md$/.test(filePath);
}

/**
 * Read a 'part' (header, footer) file from disk
 * and cache it in memory
 */
var parts = {};
function getPart(part) {
  'use strict';
  if (parts[part]) {
    return parts[part];
  }
  parts[part] = fs.readFileSync(part, 'utf-8');
  return parts[part];
}

/**
 * Pick first num items from arr
 */
function first(num, arr) {
  'use strict';
  if (arr.length < num) return arr;
  return arr.slice(0, num);
}

/**
 * Pick last num items from arr
 */
function last(num, arr) {
  'use strict';
  if (arr.length < num) return arr;
  return arr.slice(arr.length - num, arr.length);
}

/**
 * Synchronously delete a directory and it's subdirectories
 */
function deleteDir(dir) {
  'use strict';
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function(file, index) {
      var currentDir = path.join(dir, file);
        if (fs.statSync(currentDir).isDirectory()) {
           deleteDir(currentDir);
        } else {
          fs.unlinkSync(currentDir);
        }
    });
    fs.rmdirSync(dir);
  }
}

/**
 * Replace all tags in the given text
 * Parameter 'tags' is an object with keys corresponding
 * to the tags and values to the strings to replace with
 */
function replaceTags(text, tags) {
  'use strict';
  for (var tag in tags) {
    var re = new RegExp('{{' + tag + '}}', 'g');
    text = text.replace(re, tags[tag]);
  }
  return text;
}

function collectMonths(posts) {
  'use strict';
  return posts.reduce(function(acc, curr) {
    var date = moment(curr.timestamp),
        yearMonthStr = date.format('YYYY-MM');
    if (!acc[yearMonthStr]) {
      acc[yearMonthStr] = [curr];
    } else {
      acc[yearMonthStr].push(curr);
    }
    return acc;
  }, {});
}

module.exports = {
  walk: walk,
  isMarkdownFile: isMarkdownFile,
  getPart: getPart,
  first: first,
  last: last,
  deleteDir: deleteDir,
  replaceTags: replaceTags,
  collectMonths: collectMonths
};
