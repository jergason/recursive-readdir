# CLAUDE.md

## Project overview

recursive-readdir is a Node.js utility that recursively lists all files in a directory and its subdirectories. It supports filtering via glob patterns (minimatch) and custom functions, with both callback and Promise APIs.

- **Language:** JavaScript (CommonJS, Node.js >=6.0.0)
- **Single source file:** `index.js`
- **Production dependency:** `minimatch`

## Commands

```bash
# Install dependencies
npm install

# Run tests
npm test
```

There is no build step, linter, or formatter configured.

## Architecture

- `index.js` — entire library source (~96 lines). Exports a single function `readdir(path, [ignores], [callback])`.
- `test/recursive-readdir-test.js` — Mocha test suite with fixtures in `test/testdir/`, `test/testdirBeta/`, and `test/testsymlinks/`.

## Testing

Tests use Mocha with Node's built-in `assert` module. Test fixtures are checked-in directories under `test/`. Always run `npm test` to verify changes.
