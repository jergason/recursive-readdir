var fs = require('fs')
var p = require('path')
var minimatch = require('minimatch')

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

    var ignoreOpts = {matchBase: true}
    files.forEach(function (file) {
      fs.lstat(p.join(path, file), function (err, stats) {
        if (err) {
          return callback(err)
        }

        file = p.join(path, file)
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

module.exports = readdir
