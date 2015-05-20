var fs = require('fs')
var pathJoin = require('path').join
var minimatch = require('minimatch')

var ignoreOpts = {matchBase: true}

// how to know when you are done?
function readdir(path, ignores, callback) {
  if (typeof ignores == 'function') {
    callback = ignores
    ignores  = []
  }
  var list = []

  fs.readdir(path, function (err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length
    if (!pending) {
      // we are done, woop woop
      return callback(null, list)
    }

    files.forEach(function (file) {
      fs.lstat(pathJoin(path, file), function (err, stats) {
        if (err) {
          return callback(err)
        }

        file = pathJoin(path, file)
        if (stats.isDirectory()) {
          files = readdir(file, ignores, function (err, res) {
            if (err) {
              return callback(err)
            }

            list = list.concat(res)
            pending -= 1
            if (!pending) {
              callback(null, list)
            }
          })
        }
        else {
          for (var i = 0; i < ignores.length; i++) {
            if (minimatch(file, ignores[i], ignoreOpts)) {
              pending -= 1
              if (pending <= 0) {
                callback(null, list)
              }
              return
            }
          }
          list.push(file)
          pending -= 1
          if (!pending) {
            callback(null, list)
          }
        }
      })
    })
  })
}

var readdirSync = function(dir, ignores) {
  var results = []
  var list = fs.readdirSync(dir)

  if (!list) {
    return results
  }

  list.forEach(function(file) {
    file = pathJoin(dir, file);
    var stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      var res = readdirSync(file, ignores)
      results = results.concat(res)
    } else {
      var isIgnored = false

      if (Array.isArray(ignores)) {
        ignores.some(function(ignore) {
          if (minimatch(file, ignore, ignoreOpts)) {
            isIgnored = true
            return true
          }
        })
      }

      if (!isIgnored) {
        results.push(file)
      }
    }
  })

  return results
}

module.exports = readdir

module.exports.sync = readdirSync
