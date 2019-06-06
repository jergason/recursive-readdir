var fs = require("fs");
var p = require("path");
var minimatch = require("minimatch");

function patternMatcher(pattern) {
  return function(filePath, stats) {
    var minimatcher = new minimatch.Minimatch(pattern, { matchBase: true });
    return (
      (!minimatcher.negate || stats.isFile()) && minimatcher.match(filePath)
    );
  };
}

function toMatcherFunction(ignoreEntry) {
  return typeof ignoreEntry == "function"
    ? ignoreEntry
    : patternMatcher(ignoreEntry);
}

function readdir(path, ignores, callback) {
  if (typeof ignores == "function") {
    callback = ignores;
    ignores = [];
  }

  if (!callback) {
    return new Promise(function(resolve, reject) {
      readdir(path, ignores || [], function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  ignores = ignores.map(toMatcherFunction);

  var list = [];

  fs.readdir(path, function(err, files) {
    if (err) {
      return callback(err);
    }

    // keep a counter of how many files we need to process
    // so it's easy to check when we're done
    var pending = files.length;
    if (!pending) {
      // we've hit a base case: no files inside this directory
      // return back up
      return callback(null, list);
    }

    files.forEach(function(file) {
      var filePath = p.join(path, file);
      fs.stat(filePath, function(_err, stats) {
        if (_err) {
          return callback(_err);
        }

        if (
          ignores.some(function(matcher) {
            return matcher(filePath, stats);
          })
        ) {
          pending -= 1;
          if (!pending) {
            // we've hit a base case: we've processed all the files
            // return from the recursion
            return callback(null, list);
          }
          return null;
        }

        if (stats.isDirectory()) {
          readdir(filePath, ignores, function(__err, res) {
            if (__err) {
              return callback(__err);
            }

            list = list.concat(res);
            pending -= 1;
            if (!pending) {
              // we've hit a base case: we've processed all the files
              // return from the recursion
              return callback(null, list);
            }
          });
        } else {
          list.push(filePath);
          pending -= 1;
          if (!pending) {
            // we've hit a base case: we've processed all the files
            // return from the recursion
            return callback(null, list);
          }
        }
      });
    });
  });
}

module.exports = readdir;
