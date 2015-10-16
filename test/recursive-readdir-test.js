/* eslint-env mocha */
var assert = require('assert')
var p = require('path')
var readdir = require('../index')

function getAbsolutePaths(files) {
  return files.map(function(file) {
    return p.join(__dirname, file)
  })
}

describe('readdir', function() {
  it('correctly lists all files in nested directories', function(done) {
    var expectedFiles = getAbsolutePaths([
      '/testdir/a/a', '/testdir/a/beans',
      '/testdir/b/123', '/testdir/b/b/hurp-durp',
      '/testdir/c.txt', '/testdir/d.txt'
    ])

    readdir(p.join(__dirname, 'testdir'), function(err, list) {
      assert.ifError(err)
      assert.deepEqual(list.sort(), expectedFiles.sort())
      done()
    })
  })

  it('ignores the files listed in the ignores array', function(done) {
    var notExpectedFiles = getAbsolutePaths([
      '/testdir/d.txt', '/testdir/a/beans'
    ])

    readdir(p.join(__dirname, 'testdir'), ['d.txt', 'beans'], function(err, list) {
      assert.ifError(err)
      list.forEach(function(file) {
        assert.equal(notExpectedFiles.indexOf(file), -1,
          'Failed to ignore file "' + file + '".')
      })
      done()
    })
  })

  it('supports ignoring files with just basename globbing', function(done) {
    var notExpectedFiles = getAbsolutePaths([
      '/testdir/d.txt', '/testdir/a/beans'
    ])

    readdir(p.join(__dirname, 'testdir'), ['*.txt', 'beans'], function(err, list) {
      assert.ifError(err)
      list.forEach(function(file) {
        assert.equal(notExpectedFiles.indexOf(file), -1,
          'Failed to ignore file "' + file + '".')
      })
      done()
    })
  })

  it('supports ignoring files with the globstar syntax', function(done) {
    var notExpectedFiles = getAbsolutePaths([
      '/testdir/d.txt', '/testdir/a/beans'
    ])

    var ignores = ['**/*.txt', '**/a/beans']

    readdir(p.join(__dirname, 'testdir'), ignores, function(err, list) {
      assert.ifError(err)
      list.forEach(function(file) {
        assert.equal(notExpectedFiles.indexOf(file), -1,
          'Failed to ignore file "' + file + '".')
      })
      done()
    })
  })

  it('works when there are no files to report except ignored files', function(done) {
    readdir(p.join(__dirname, 'testdirBeta'), ['ignore.txt'], function(err, list) {
      assert.ifError(err)
      assert.equal(list.length, 0, 'expect to report 0 files')
      done()
    })
  })

  it('works when negated ignore list is given', function(done) {
    var expectedFiles = getAbsolutePaths([
      '/testdir/c.txt', '/testdir/d.txt', '/testdirBeta/ignore.txt'
    ])

    readdir(__dirname, ['!*.txt'], function(err, list) {
      assert.ifError(err)
      assert.deepEqual(list.sort(), expectedFiles,
                       'Failed to find expected files.')
      done()
    })
  })
})
