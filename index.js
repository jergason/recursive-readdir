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
  let ignores = [];
  let $opts;
  if (typeof opts == "function") {
    callback = opts;
    $opts = {
      ignores
    };
  } else if (Array.isArray(opts)) {
    ignores = opts;
    $opts = {
      ignores
    };
  } else if (isObject(opts)) {
    $opts = {
      ...opts
    };
  } else {
    throw `Invalid opts: ${opts}, must be an Array, Object or Function, was: ${typeof opts}`;
  }

  const debug = $opts.debug;
  const log = createLogger(debug, $opts.log || console.log);
  if (debug) {
    delete $opts.fs;
    log({ path, opts: $opts });
  }
  $opts.log = log;
  let fileSys = fs;

  $opts.ignores = $opts.ignores || [];

  if ($opts.fs) {
    log("using custom fs");
  } else {
    log("using node fs");
  }

  fileSys = $opts.fs || fileSys;

  if (!callback) {
    log("create promise");
    $opts.ignores = prepareIgnores($opts.ignores, toMatcherFunction);
    return new Promise(function(resolve, reject) {
      $readdir(path, $opts, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  $opts.ignores = prepareIgnores($opts.ignores, toMatcherFunction);
  log("$readdir", { path, opts: $opts });
  $readdir(path, $opts, callback);
}

const prepareIgnores = (ignores, toMatcherFunction) => {
  return ignores.map(toMatcherFunction);
};

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
