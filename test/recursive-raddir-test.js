(function () {
  "use strict";
  var vows = require('vows')
    , assert = require('assert')
    , readdir = require(__dirname + '/../index')
    ;

  vows.describe('readdir').addBatch({
    'it works': {
      topic: function () {
        console.log(__dirname + '/testdir');
        readdir(__dirname + '/testdir', this.callback);
      },
      'it correctly lists all files in nested directories': function (err, list) {
        var expectedFiles
          ;

        expectedFiles = [__dirname + '/testdir/a/a', __dirname + '/testdir/a/beans',
          __dirname + '/testdir/b/123', __dirname + '/testdir/b/b/hurp-durp',
          __dirname + '/testdir/c.txt', __dirname + '/testdir/d.txt'
        ].sort();
        assert.strictEqual(null, err);
        assert.deepEqual(list.sort(), expectedFiles.sort());
      }
    }
  }).export(module);
}());
