var fs = require("fs");
var p = require("path");
var minimatch = require("minimatch");

// we expose this as a the top-level API to maintain backwards compatability
// and support a callback-based API
function recursiveReaddirCallback(path, ignores, callback) {
  if (typeof ignores == "function") {
    callback = ignores;
    ignores = [];
  }

  if (!callback) {
    return recursiveReaddir(path, ignores);
  } else {
    return recursiveReaddir(path, ignores).then(
      function(list) {
        return callback(null, list);
      },
      function(err) {
        return callback(err, null);
      }
    );
  }
}

function recursiveReaddir(path, ignores) {
  if (!ignores) {
    ignores = [];
  }
  ignores = ignores.map(toMatcherFunction);

  return readdirP(path).then(function(files) {
    if (files.length === 0) {
      // if we don't have any files we just bail
      return [];
    }

    // process each entry recursively (in case it is a directory)
    return Promise.all(files.map(processFile(path, ignores))).then(function(
      foundFiles
    ) {
      return list.concat(
        // foundFiles will have nested arrays if there are subdirectories
        // so make sure to flatten it
        flatten(
          // we'll also have undefineds when there are ignored files so remove those
          foundFiles.filter(function(f) {
            return !!f;
          })
        )
      );
    });
  });
}

// let's partially apply this for a nicer API
function processFile(path, ignores) {
  return function(file) {
    var filePath = p.join(path, file);
    return statP(filePath).then(function(stats) {
      // if we should ignore this file, skip over it
      if (
        ignores.some(function(matcher) {
          return matcher(filePath, stats);
        })
      ) {
        return;
      }

      if (stats.isDirectory()) {
        // recurse through the nested directory
        return recursiveReaddir(filePath, ignores);
      } else {
        // just return the individual file
        return filePath;
      }
    });
  };
}

// convert an entry in to the ingores array in to a file matcher function
// if it isn't already
function toMatcherFunction(ignoreEntry) {
  return typeof ignoreEntry == "function"
    ? ignoreEntry
    : patternMatcher(ignoreEntry);
}

// convert a glob pattern in to a matcher function
function patternMatcher(pattern) {
  return function(filePath, stats) {
    var minimatcher = new minimatch.Minimatch(pattern, { matchBase: true });
    return (
      (!minimatcher.negate || stats.isFile()) && minimatcher.match(filePath)
    );
  };
}

// flatten a nested array, thanks stackoverflow
function flatten(arr) {
  return [].concat.apply([], arr);
}

// fs.readdir promisified
function readdirP(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, function(err, files) {
      if (err) {
        return reject(err);
      }
      return resolve(files);
    });
  });
}

// fs.stat promisified
function statP(path) {
  return new Promise(function(resolve, reject) {
    fs.stat(path, function(err, stats) {
      if (err) {
        return reject(err);
      }
      return resolve(stats);
    });
  });
}

module.exports = recursiveReaddirCallback;
