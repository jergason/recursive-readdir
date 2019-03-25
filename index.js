var fs = require("fs");
var p = require("path");
var minimatch = require("minimatch");

function patternMatcher(pattern) {
  return function(path, stats) {
    var minimatcher = new minimatch.Minimatch(pattern, { matchBase: true });
    return (!minimatcher.negate || stats.isFile()) && minimatcher.match(path);
  };
}

function toMatcherFunction(ignoreEntry) {
  if (typeof ignoreEntry == "function") {
    return ignoreEntry;
  } else {
    return patternMatcher(ignoreEntry);
  }
}

function isObject(obj) {
  return obj === Object(obj);
}

function readdir(path, opts = {}, callback) {
  if (debug) {
    const $opts = {
      ...opts
    };
    delete $opts.fs;
    console.log("readdir", { path, opts: $opts });
  }

  let ignores = [];
  let fileSys = fs;

  if (isObject(opts)) {
    debug = opts.debug;
    ignores = opts.ignores || [];
    if (debug) {
      if (opts.fs) {
        console.log("readdir: using custom fs");
      } else {
        console.log("readdir: using node fs");
      }
    }
    fileSys = opts.fs || fileSys;
  }

  if (typeof opts == "function") {
    callback = opts;
    ignores = [];
  }

  if (!callback) {
    return new Promise(function(resolve, reject) {
      opts.ignores = opts.ignores || [];
      $readdir(path, opts, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  ignores = ignores || [];
  ignores = ignores.map(toMatcherFunction);

  opts.ignores = ignores;

  $readdir(path, opts, callback);
}

function $readdir(path, opts = {}, callback) {
  var list = [];
  const ignores = opts.ignores || [];
  const fileSys = opts.fs || fs;

  fileSys.readdir(path, function(err, files) {
    if (err) {
      return callback(err);
    }

    var pending = files.length;
    if (!pending) {
      // we are done, woop woop
      return callback(null, list);
    }

    files.forEach(function(file) {
      var filePath = p.join(path, file);
      fileSys.stat(filePath, function(_err, stats) {
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
            return callback(null, list);
          }
          return null;
        }

        if (stats.isDirectory()) {
          readdir(filePath, opts, function(__err, res) {
            if (__err) {
              return callback(__err);
            }

            list = list.concat(res);
            pending -= 1;
            if (!pending) {
              return callback(null, list);
            }
          });
        } else {
          list.push(filePath);
          pending -= 1;
          if (!pending) {
            return callback(null, list);
          }
        }
      });
    });
  });
}

module.exports = readdir;
