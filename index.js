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

const createLogger = (debug, log) => (...msg) => debug && log(...msg);

function readdir(path, opts = {}, callback) {
  const debug = opts.debug;
  const log = createLogger(debug, opts.log || console.log);
  if (debug) {
    const $opts = {
      ...opts
    };
    delete $opts.fs;
    log({ path, opts: $opts });
  }
  opts.log = log;
  let ignores = [];
  let fileSys = fs;
  if (isObject(opts)) {
    ignores = opts.ignores || [];
    if (opts.fs) {
      log("using custom fs");
    } else {
      log("using node fs");
    }
    fileSys = opts.fs || fileSys;
  }

  if (typeof opts == "function") {
    callback = opts;
    ignores = [];
  }

  if (!callback) {
    log("create promise");
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
  const log = opts.log;
  var list = [];
  var ignored = [];
  const ignores = opts.ignores || [];
  const fileSys = opts.fs || fs;

  fileSys.readdir(path, function(err, files) {
    if (err) {
      return callback(err);
    }
    var pending = files.length;
    if (!pending) {
      // we are done, woop woop
      return callback(null, list, { ignored });
    }

    files.forEach(function(file) {
      var filePath = p.join(path, file);
      fileSys.stat(filePath, function(_err, stats) {
        if (_err) {
          return callback(_err);
        }

        if (
          ignores.some(matcher => {
            return matcher(filePath, stats);
          })
        ) {
          log("ignored", filePath);
          ignored.push(filePath);
          pending -= 1;
          if (!pending) {
            return callback(null, list, { ignored });
          }
          return null;
        }

        if (stats.isDirectory()) {
          log("recurse folder", filePath);
          readdir(filePath, opts, function(__err, res) {
            if (__err) {
              return callback(__err);
            }

            list = list.concat(res);
            pending -= 1;
            if (!pending) {
              return callback(null, list, { ignored });
            }
          });
        } else {
          log("add", filePath);
          list.push(filePath);
          pending -= 1;
          if (!pending) {
            return callback(null, list, { ignored });
          }
        }
      });
    });
  });
}

module.exports = readdir;
