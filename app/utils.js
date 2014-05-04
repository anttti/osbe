const
  fs = require('fs'),
  path = require('path'),
  ncp = require('ncp'),
  Promise = require('bluebird');

var walk = function(dir, done) {
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
  return /.md$/.test(filePath);
}

var parts = {};
function getPart(part) {
  if (parts[part]) {
    return parts[part];
  }
  parts[part] = fs.readFileSync(part, 'utf-8');
  return parts[part];
}

/**
 * Pick last num items from arr
 */
function last(num, arr) {
  if (arr.length < num) return arr;
  return arr.slice(arr.length - num, arr.length);
}

function deleteDir(dir) {
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
};

module.exports = {
  walk: walk,
  isMarkdownFile: isMarkdownFile,
  getPart: getPart,
  last: last,
  deleteDir: deleteDir
};