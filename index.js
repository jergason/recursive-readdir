let fs = require('fs')
,		p = require('path')
,		minimatch = require('minimatch')

function patternMatcher(pattern) {
  return (path, stats) => {
    let minimatcher = new minimatch.Minimatch(pattern, { matchBase: true })
    return (!minimatcher.negate || stats.isFile()) && minimatcher.match(path)
  }
}

function toMatcherFunction(ignoreEntry) {
  return (typeof ignoreEntry == 'function') ? ignoreEntry : patternMatcher(ignoreEntry)
}

function readdir(path, ignores, callback) {
  if (typeof ignores == 'function') {
    callback = ignores
    ignores = []
  }

  if (!callback) {
    return new Promise((resolve, reject) => {
      readdir(path, ignores || [], (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  ignores = ignores.map(toMatcherFunction)

  let list = []

  fs.readdir(path, (err, files) => {
    if (err) {
      return callback(err)
    }

    let pending = files.length
    if (!pending) {
      // we are done, woop woop
      return callback(null, list)
    }

    for(let i = 0; i < pending; i++) {
      let filePath = p.join(path, files[i])
      fs.stat(filePath, (_err, stats) => {
        if (_err) {
          return callback(_err)
        }

        if (
          ignores.some(matcher => {
            return matcher(filePath, stats)
          })
        ) {
          pending -= 1
          if (!pending) {
            return callback(null, list)
          }
          return null
        }

        if (stats.isDirectory()) {
          readdir(filePath, ignores, (__err, res) => {
            if (__err) {
              return callback(__err)
            }

            list = list.concat(res)
            pending -= 1
            if (!pending) {
              return callback(null, list)
            }
          })
        } else {
          list.push(filePath)
          pending -= 1
          if (!pending) {
            return callback(null, list)
          }
        }
      })
    }
  })
}

module.exports = readdir
