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

function toMatcherFunction(ignoreEntry) {
  return typeof ignoreEntry == "function"
    ? ignoreEntry
    : patternMatcher(ignoreEntry);
}

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

  var list = [];

  return readdirP(path).then(function(files) {
    // keep a counter of how many files we need to process
    // so it's easy to check when we're done
    var pending = files.length;
    if (!pending) {
      // we've hit a base case: no files inside this directory
      // return back up
      return list;
    }

    // return a promise when all files inside me have been resolved
    return Promise.all(files.map(processFile(path, ignores))).then(function(
      foundFiles
    ) {
      // TODO: filter out the undefineds this I think
      // TODO: fix this, concat them?
      // wait no this is a list of results from whatever processFile is
      // flatten this?
      return list.concat(
        [].concat.apply(
          [],
          foundFiles.filter(function(f) {
            // filter out underfineds
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
        // if this file should be ignored, just skip over it
        return;
      }

      if (stats.isDirectory()) {
        // if it's a directory, recurse through it
        return recursiveReaddir(filePath, ignores);
      } else {
        // just return the individual file
        return filePath;
      }
    });
  };
}

// we expose this as a the top-level API to maintain backwards compatability
module.exports = recursiveReaddirCallback;
