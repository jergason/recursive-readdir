# recursive-readdir

[![Build Status](https://travis-ci.org/jergason/recursive-readdir.svg?branch=master)](https://travis-ci.org/jergason/recursive-readdir)

A Node module for recursively listing all files in a directory and its subdirectories. It does not list the directories themselves.

Because it uses fs.readdir, which calls [readdir](http://linux.die.net/man/3/readdir) under the hood
on OS X and Linux, the order of files inside directories is [not guaranteed](http://stackoverflow.com/questions/8977441/does-readdir-guarantee-an-order).

## Installation

    npm install recursive-readdir

## Usage


```javascript
var recursive = require('recursive-readdir');

recursive('some/path', function (err, files) {
  // Files is an array of filename
  console.log(files);
});
```

It can also take a list of files to ignore.

```javascript
var recursive = require('recursive-readdir');

// ignore files named 'foo.cs' or files that end in '.html'.
recursive('some/path', ['foo.cs', '*.html'], function (err, files) {
  // Files is an array of filename
  console.log(files);
});
```

You can also pass functions which are called to determine whether or not to
ignore a file:

```javascript
var recursive = require('recursive-readdir');

function ignoreFunc(file, stats) {
  // `file` is the absolute path to the file, and `stats` is an `fs.Stats`
  // object returned from `fs.lstat()`.
  return stats.isDirectory() && path.basename(file) == "test";
}

// Ignore files named 'foo.cs' and descendants of directories named test
recursive('some/path', ['foo.cs', ignoreFunc], function (err, files) {
  // Files is an array of filename
  console.log(files);
});
```

The ignore strings support Glob syntax via
[minimatch](https://github.com/isaacs/minimatch).

## Options
```javascript
recursive('some/path', options, callback)
```

Option can be
- an array of files to ignore
- an object with one or more property:
    - "ignores": [] -> an array of files to ignore
    - "forceContinue": true/false -> a boolean. true to return files even if errors occures with fs.stat (if symbolic links are broken)
