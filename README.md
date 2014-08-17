#recursive-readdir

[![Build Status](https://travis-ci.org/jergason/recursive-readdir.svg?branch=master)](https://travis-ci.org/jergason/recursive-readdir)

A simple Node module for recursively listing all files in a directory,
or in any subdirectories.

It does not list directories themselves.

##Installation

    npm install recursive-readdir

##Usage


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

The ignore strings support Glob syntax via
[minimatch](https://github.com/isaacs/minimatch).
