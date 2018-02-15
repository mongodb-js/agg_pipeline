# stage-validator

[![build status](https://secure.travis-ci.org/mongodb-js/stage-validator.png)](http://travis-ci.org/mongodb-js/stage-validator)

Validates a MongoDB aggregation pipeline stage.

## Usage

The main module exposes two functions: `accepts(stageStr)` and `parse(stageStr)`.

#### `accepts(stageStr)`

The `accepts(stageStr)` function takes a pipeline stage string and returns `true` if the
string is a valid MongoDB pipeline stage, `false` otherwise.

Example:

```javascript
var accepts = require('compass-stage-validator').accepts;
var assert = require('assert');

assert.ok(accepts('{"$limit": 1}'));
assert.ok(accepts('{"match": {"x": 35}}'));

assert.equal(accepts('{"$invalid": "key"}'), false);
```
