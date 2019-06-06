var process = require("process");
var path = require("path");
var benchmark = require("benchmark");
var readdir = require("../");

function cycle(e, newline) {
  process.stdout.write(`\u001b[G  ${e.target}${newline ? "\n" : ""}`);
}

function bench(name) {
  var config = {
    name: name,
    defer: true
  };
  var suite = new benchmark.Suite(config);
  var add = suite.add.bind(suite);
  suite.on("error", console.error);

  console.log(`\n# ${config.name}`);
  suite.add = function(key, fn) {
    add({
      name: key,
      onCycle: function(e) {
        return cycle(e);
      },
      onComplete: function(e) {
        return cycle(e, true);
      },
      fn,
      defer: true
    });
    return suite;
  };

  return suite;
}

// bench("smalldir")
//   .add("promises", function(deferred) {
//     readdir(path.join(__dirname, "smalldir")).then(function(res) {
//       return deferred.resolve();
//     });
//   })
//   .add("callbacks", function(deferred) {
//     readdir.callbacks(path.join(__dirname, "smalldir")).then(function(res) {
//       return deferred.resolve();
//     });
//   })
//   .run();

bench("largedir")
  .add("promises", function(deferred) {
    readdir(path.join(__dirname, "largedir")).then(function(res) {
      return deferred.resolve();
    });
  })
  .add("callbacks", function(deferred) {
    readdir.callbacks(path.join(__dirname, "largedir")).then(function(res) {
      return deferred.resolve();
    });
  })
  .run();

// console.time("promises");
// readdir(path.join(__dirname, "largedir")).then(function(res) {
//   console.timeEnd("promises");
// });

// console.time("callbacks");
// readdir.callbacks(path.join(__dirname, "largedir")).then(function(res) {
//   console.timeEnd("callbacks");
// });
