const chai = require('chai');
const expect = chai.expect;
const acceptStage = require('../lib').accepts;

function accepts(str) {
  expect(acceptStage(str)).to.equal(true);
}

function rejects(str) {
  expect(acceptStage(str)).to.equal(false);
}

describe('#accepts', () => {
  describe('constants', () => {
    describe('$limit', () => {
      it('accepts a positive integer', () => {
        accepts('{$limit: 1}');
      });
      it('rejects a negative integer', () => {
        rejects('{$limit: -1}');
      });
      it('rejects a string', () => {
        rejects('{$limit: "1"}');
      });
    });
    describe('$count', () => {
      it('accepts a string', () => {
        accepts('{$count: "id field"}');
      });
      it('rejects an integer', () => {
        rejects('{$count: 1}');
      });
    });
    describe('$skip', () => {
      it('accepts a positive integer', () => {
        accepts('{$skip: 10}');
      });
      it('rejects a negative integer', () => {
        rejects('{$skip: -1}');
      });
      it('rejects a string', () => {
        rejects('{$skip: "10"}');
      });
    });
    describe('$out', () => {
      it('accepts a string', () => {
        accepts('{$out: "coll"}');
      });
      it('rejects an integer', () => {
        rejects('{$out: 1}');
      });
    });
    describe('$indexStats', () => {
      it('accepts an empty document', () => {
        accepts('{$indexStats: {}}');
      });
      it('rejects a nonempty document', () => {
        rejects('{$indexStats: {x: 1}}');
      });
      it('rejects a nondoc', () => {
        rejects('{$indexStats: 1}');
      });
    });
  });
  describe('expressions with only expr', () => {
    describe('$sortByCount', () => {
      it('accepts a $fieldname', () => {
        accepts('{$sortByCount: "$field"}');
      });
      it('rejects a fieldname without $', () => {
        rejects('{$sortByCount: "field"}');
      });
      it('accepts an agg expression', () => {
        accepts('{$sortByCount: {$mergeObjects: [\'$test\', \'$test2\']}}');
      });
      it('rejects a non-obj expression', () => {
        rejects('{$sortByCount: [{$mergeObjects: [\'$test\', \'$test2\']}]}');
      });
      it('rejects an empty obj', () => {
        rejects('{$sortByCount: {}}');
      });
      it('rejects a document literal', () => {
        rejects('{$sortByCount: {test: "$testing"}}');
      });
      it('accepts a doc with $', () => {
        accepts('{$sortByCount: {$test: "$testing"}}');
      });
      it('accepts a doc with $', () => {
        accepts('{$sortByCount: {"$test": "$testing"}}');
      });
    });
    describe('redact', () => {
      // TODO: Check if evaluates to $$DESCEND/PRUNE/$$KEEP?
      it('accepts $cond', () => {
        accepts('{$redact: {$cond: {\n' +
          '          if: { $eq: [ "$level", 5 ] },\n' +
          '          then: "$$PRUNE",\n' +
          '          else: "$$DESCEND"\n' +
          '        }}}');
      });
      it('accepts sys var string', () => {
        accepts('{$redact: "$$PRUNE"}');
        accepts('{$redact: "$$DESCEND"}');
        accepts('{$redact: "$$KEEP"}');
      });
      it('rejects other string', () => {
        rejects('{$redact: "other string"}');
      });
    });
  });
  describe('expressions with required set fields', () => {
    describe('$sample', () => {
      it('accepts a doc with size', () => {
        accepts('{ $sample: { size: 10 } }');
      });
      it('accepts a doc with "size"', () => {
        accepts('{ $sample: { "size": 10 } }');
      });
      it('rejects a doc with size as a string', () => {
        rejects('{ $sample: { size: "10" } }');
      });
      it('rejects a doc without size', () => {
        rejects('{ $sample: { notsize: 10 } }');
      });
      it('rejects a string', () => {
        rejects('{$sample: "10"}');
      });
    });
    describe('$replaceRoot', () => {
      it('accepts a doc with newRoot', () => {
        accepts('{ $replaceRoot: { newRoot: {x: 10} } }');
      });
      it('accepts a doc with empty newRoot', () => {
        accepts('{ $replaceRoot: { newRoot: {} } }');
      });
      it('accepts a doc with "newRoot"', () => {
        accepts('{ $replaceRoot: { "newRoot": {x: 10} } }');
      });
      it('rejects a doc without newRoot', () => {
        rejects('{ $replaceRoot: { notnewRoot: {x: 10}}}');
      });
      it('rejects a doc with a non-doc newRoot', () => {
        rejects('{ $replaceRoot: { newRoot: 10}}');
      });
      it('accepts an agg expr', () => { // TODO: validate that expr resolves to document?
        accepts('{ $replaceRoot: { "newRoot": {$abs: 10} } }');
      });
    });
  });
  describe('expressions with optional set fields', () => {
    describe('$collStats', () => { // TODO: validate that its the first? Why is count in the docs?
      it('accepts an empty doc', () => {
        accepts('{ $collStats: {} }');
      });
      it('accepts just latencyStats', () => {
        accepts('{ $collStats: { latencyStats: {histograms: true}}}');
      });
      it('accepts just storageStats', () => {
        accepts('{$collStats: {storageStats: {}}}');
      });
      it('accepts all fields', () => {
        accepts(
          '{$collStats: {' +
            'latencyStats: {histograms: true},' +
            ' storageStats: {}' +
          '}}'
        );
      });
      it('rejects without comma', () => {
        rejects('{ $collStats: {storageStats: {} storageStats: {}} }');
      });
      it('rejects unknown fields', () => {
        rejects('{ $collStats: {somethingelse: 1} }');
      });
    });
    describe('$currentOp', () => {
      it('accepts an empty doc', () => {
        accepts('{ $currentOp: {} }');
      });
      it('accepts just allUsers', () => {
        accepts('{ $currentOp: { allUsers: true}}');
      });
      it('accepts just idleConnections', () => {
        accepts('{$currentOp: {idleConnections: false}}');
      });
      it('accepts all fields', () => {
        accepts(
          '{$currentOp: { allUsers: true, idleConnections: false }}'
        );
      });
      it('rejects without comma', () => {
        rejects('{ $currentOp: {idleConnections: true idleConnections: true} }');
      });
      it('rejects unknown fields', () => {
        rejects('{ $currentOp: {somethingelse: 1} }');
      });
    });
    describe('$lookup', () => {
      it('rejects an empty doc', () => {
        rejects('{$lookup: {}}');
      });
      it('rejects an incomplete doc', () => {
        rejects('{$lookup: {' +
          'from: toJoin,' +
          '}}');
      });
      it('accepts full doc', () => {
        accepts('{$lookup: {' +
          'from: "fromColl", localField: "inputField",' +
          'foreignField: "fromField", as: "outArray"' +
          '}}'
        );
      });
      it('rejects wrong types', () => {
        rejects('{$lookup: {' +
          'from: 1, localField: {},' +
          'foreignField: 1, as: 1.0' +
          '}}'
        );
      });
      it('supports let and pipeline', () => {
        accepts('{$lookup:' +
          '{\n' +
          '           from: "warehouses",\n' +
          '           let: { order_item: "$item", order_qty: "$ordered" },\n' +
          '           pipeline: [\n' +
          '              { $match:\n' +
          '                 { $expr:\n' +
          '                    { $and:\n' +
          '                       [\n' +
          '                         { $eq: [ "$stock_item",  "$$order_item" ] },\n' +
          '                         { $gte: [ "$instock", "$$order_qty" ] }\n' +
          '                       ]\n' +
          '                    }\n' +
          '                 }\n' +
          '              },\n' +
          '              { $project: { stock_item: 0, _id: 0 } }\n' +
          '           ],\n' +
          '           as: "stockdata"\n' +
          '         }' +
          '}');
      });
    });
    describe('$geoNear', () => {
      it('accepts full doc', () => {
        accepts(
          '{$geoNear: {' +
            'minDistance: 10.1,' +
            'distanceField: "toField",' +
            'spherical: true,' +
            'limit: 100,' +
            'num: 100,' +
            'uniqueDocs: true,' +
            'maxDistance: 100,' +
            'query: {x: 1},' +
            'distanceMultiplier: 100,' +
            'includeLocs: "outputfield",' +
            'near: {type: "Point", coordinates: [10.01, 9.99]}' +
          '}}');
      });
      it('rejects a doc without near', () => {
        rejects(
          '{$geoNear: {' +
          'spherical: true,' +
          'limit: 100,' +
          'num: 100,' +
          'maxDistance: 100,' +
          'query: {x: 1},' +
          'distanceMultiplier: 100,' +
          'uniqueDocs: true,' +
          'distanceField: "toField",' +
          'includeLocs: "outputfield",' +
          'minDistance: 10.1' +
          '}}');
      });
      it('rejects a doc without distanceField', () => {
        rejects(
          '{$geoNear: {' +
          'spherical: true,' +
          'limit: 100,' +
          'num: 100,' +
          'maxDistance: 100,' +
          'query: {x: 1},' +
          'distanceMultiplier: 100,' +
          'uniqueDocs: true,' +
          'includeLocs: "outputfield",' +
          'minDistance: 10.1' +
          'near: false,' +
          '}}');
      });
      it('accepts the two required', () => {
        accepts(
          '{$geoNear: { ' +
          'near: {type: "Point", coordinates: [10.01, 9.99]},' +
          'distanceField: "field" } }'
        );
      });
      it('rejects the two required if type wrong', () => {
        rejects(
          '{$geoNear: { near: 1, distanceField: 1 } }'
        );
      });
      it('rejects if query not a document', () => {
        rejects(
          '{$geoNear: { near: true, distanceField: "field", query: 1 } }'
        );
      });
      describe('near', () => {
        it('rejects non-point geoJSON for near', () => {
          rejects(
            '{$geoNear: { ' +
            'near: ' +
            '{ type: "LineString", coordinates: [ [ 40, 5 ], [ 41, 6 ] ] }' +
            ', distanceField: "field" } }'
          );
        });
        it('rejects bad geoJSON', () => {
          rejects(
            '{$geoNear: { ' +
            'near: {type: "Point", coordinates: [ -9.99 ]},' +
            'distanceField: "field" } }'
          );
        });
        it('rejects non-geoJSON for near', () => {
          rejects(
            '{$geoNear: { ' +
            'near: ' +
            '{ x: 1}' +
            ', distanceField: "field" } }'
          );
        });
        it('accepts legacy coordinates', () => {
          accepts(
            '{$geoNear: { ' +
            'near: ' +
            '[ 10.0001, -33.900 ]' +
            ', distanceField: "field" } }'
          );
        });
        it('rejects bad legacy coordinates', () => {
          rejects(
            '{$geoNear: { ' +
            'near: ' +
            '[ -33.900 ]' +
            ', distanceField: "field" } }'
          );
        });
      });
    });
  });
  describe('expressions with mixed optional and required fields', () => {
    describe('$group', () => {
      it('accepts a group with _id', () => {
        accepts('{ $group: { _id: 1, field1: { $sum: "field" } } }');
      });
      it('rejects a group without _id', () => {
        rejects('{ $group: { field1: { $sum: "field" } } }');
      });
      it('rejects an empty group', () => {
        rejects('{ $group: {} }');
      });
      it('rejects a group that is not an accumulator', () => {
        rejects('{ $group: { _id: 1, field1: 1 } }');
      });
      it('accepts an agg expr for _id', () => {
        accepts('{ $group: { _id: {$abs: 1}, field1: { $sum: "field" } } }');
      });
      it('accepts an agg expr for accumulator', () => {
        accepts('{ $group: { _id: {$abs: 1}, field1: { $sum: {$abs: 1} } } }');
      });
    });
    describe('$graphLookup', () => {
      it('accepts min doc', () => {
        accepts('{$graphLookup: {' +
          'from: "employees",' +
          'startWith: "$reportsTo",' +
          'connectFromField: "reportsTo",' +
          'connectToField: "name",' +
          'as: "reportingHierarchy"' +
          '}}');
      });
      it('accepts full doc', () => {
        accepts('{$graphLookup: {' +
          'from: "employees",' +
          'startWith: "$reportsTo",' +
          'connectFromField: "reportsTo",' +
          'connectToField: "name",' +
          'as: "reportingHierarchy",' +
          'maxDepth: 100,' +
          'depthField: "fieldname",' +
          'restrictSearchWithMatch: {x: 1}' +
          '}}');
      });
      it('accepts an expression for startWith', () => {
        accepts('{$graphLookup: {' +
          'from: "employees",' +
          'startWith: {$abs: 1},' +
          'connectFromField: "reportsTo",' +
          'connectToField: "name",' +
          'as: "reportingHierarchy"' +
          '}}');
      });
      it('accepts an array for startWith', () => {
        accepts('{$graphLookup: {' +
          'from: "employees",' +
          'startWith: ["f1", "f2"],' +
          'connectFromField: "reportsTo",' +
          'connectToField: "name",' +
          'as: "reportingHierarchy"' +
          '}}');
      });
      it('accepts an array for connectToField', () => {
        accepts('{$graphLookup: {' +
          'from: "employees",' +
          'startWith: ["f1", "f2"],' +
          'connectFromField: "reportsTo",' +
          'connectToField: ["name", "name2"],' +
          'as: "reportingHierarchy"' +
          '}}');
      });
      it('accepts query expr for restrictSearchWithMatch', () => {
        accepts('{$graphLookup: { from: "employees", startWith: "$reportsTo",' +
          'connectFromField: "reportsTo", connectToField: "name", ' +
          'as: "reportingHierarchy", restrictSearchWithMatch: {x: {$gt: 1}}}}');
      });
      it('rejects agg expr for restrictSearchWithMatch', () => {
        rejects('{$graphLookup: { from: "employees", startWith: "$reportsTo",' +
          'connectFromField: "reportsTo", connectToField: "name",' +
          'as: "reportingHierarchy", restrictSearchWithMatch: {x: {$literal: 1}}}}');
      });
    });
    describe('$bucket', () => {
      it('accepts min doc', () => {
        accepts('{$bucket: {' +
          'groupBy: "$fieldname",' +
          'boundaries: [1,2],' +
          '}}');
      });
      it('accepts an agg expr for groupBy', () => {
        accepts('{$bucket: {' +
          'groupBy: {$abs: 1},' +
          'boundaries: [1,2],' +
          '}}');
      });
      it('accepts full doc', () => {
        accepts('{$bucket: {' +
          'groupBy: "$fieldname",' +
          'boundaries: [1,2],' +
          'default: "a string",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
      it('accepts literal in boundaries', () => {
        accepts('{$bucket: {' +
          'groupBy: "$fieldname",' +
          'boundaries: [{$literal: {x:1}}, {$literal: {x:2}}],' +
          'default: "a string",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
      it('rejects without required fields', () => {
        rejects('{$bucket: {' +
          'boundaries: [1,2],' +
          'default: "a string",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
      it('accepts test doc', () => {
        accepts('{' +
          '$bucket: {' +
          '    groupBy: "$price",' +
          '    boundaries: [ 0, 150, 200, 300, 400 ],' +
          '    default: "Other",' +
          '    output: {' +
          '        "count": { $sum: 1 },' +
          '        "titles": { $push: "$title" }' +
          '    }' +
          '}' +
          '}');
      });
    });
    describe('$bucketAuto', () => {
      it('accepts min doc', () => {
        accepts('{$bucketAuto: {' +
          'groupBy: "$fieldname",' +
          'buckets: 10' +
          '}}');
      });
      it('accepts an agg expr for groupBy', () => {
        accepts('{$bucketAuto: {' +
          'groupBy: {$abs: 1},' +
          'buckets: 10' +
          '}}');
      });
      it('accepts full doc', () => {
        accepts('{$bucketAuto: {' +
          'groupBy: "$fieldname",' +
          'buckets: 10,' +
          'granularity: "R80",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
      it('accepts literal in boundaries', () => {
        accepts('{$bucketAuto: {' +
          'groupBy: "$fieldname",' +
          'buckets: 10,' +
          'granularity: "R80",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
      it('rejects without required fields', () => {
        rejects('{$bucketAuto: {' +
          'buckets: 10,' +
          'granularity: "R80",' +
          'output: { output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
      });
    });
  });

  describe('expressions with multiple options', () => {
    describe('$unwind', () => {
      it('accepts a field path', () => {
        accepts('{ $unwind: "$fieldpath" }');
      });
      it('rejects without $', () => {
        rejects('{ $unwind: "fieldpath" }');
      });
      it('accepts full document', () => {
        accepts('{ $unwind: ' +
          '{ path: "$fieldpath",' +
          '  includeArrayIndex: "newField",' +
          '   preserveNullAndEmptyArrays: false }' +
          '}');
      });
      it('rejects includeArrayIndex with $', () => {
        rejects('{ $unwind: ' +
          '{ path: "$fieldpath",' +
          '  includeArrayIndex: "$newField",' +
          '   preserveNullAndEmptyArrays: false }' +
          '}');
      });
      it('accepts document with only path', () => {
        rejects('{ $unwind: ' +
          '{ path: "$fieldpath"' +
          '}');
      });
    });
    // TODO: supported in compass?
    describe('listLocalSessions', () => {
      it('accepts an empty doc', () => {
        accepts('{$listLocalSessions: {}}');
      });
      it('accepts allUsers', () => {
        accepts('{$listLocalSessions: {allUsers: true}}');
      });
      it('accepts one user/db', () => {
        accepts('{$listLocalSessions: {users: [' +
          '{user: "anna", db:"test"}' +
          ']}}');
      });
      it('accepts multiple user/db', () => {
        accepts('{$listLocalSessions: {users: [' +
          '{user: "anna", db:"test"}, {user: "sara", db: "test2"}' +
          ']}}');
      });
    });
    describe('listSessions', () => {
      it('accepts an empty doc', () => {
        accepts('{$listSessions: {}}');
      });
      it('accepts allUsers', () => {
        accepts('{$listSessions: {allUsers: true}}');
      });
      it('accepts one user/db', () => {
        accepts('{$listSessions: {users: [' +
          '{user: "anna", db:"test"}' +
          ']}}');
      });
      it('accepts multiple user/db', () => {
        accepts('{$listSessions: {users: [' +
          '{user: "anna", db:"test"}, {user: "sara", db: "test2"}' +
          ']}}');
      });
    });
  });

  describe('expressions with unset fields', () => {
    describe('$addFields', () => {
      it('accepts multiple fields', () => {
        accepts('{$addFields: {' +
          'field1: "value1",' +
          'field2: 1,' +
          'field3: {x: 1},' +
          '}}');
      });
      it('rejects fields with $', () => {
        rejects('{$addFields: {' +
          '$field1: "value1",' +
          '}}');
      });
      it('accepts one field', () => {
        accepts('{$addFields: {' +
          'field1: "value1",' +
          '}}');
      });
      it('rejects empty', () => {
        rejects('{$addFields: {' +
          '}}');
      });
      it('rejects non-doc', () => {
        rejects('{$addField: "test"}');
      });
      it('accepts agg expr', () => {
        accepts('{$addFields: {' +
          'field1: {$abs: 100},' +
          '}}');
      });
    });
    describe('$sort', () => {
      it('accepts multiple fields', () => {
        accepts('{$sort: {' +
          'field1: 1,' +
          'field2: -1,' +
          'field3: {$meta: "textScore"},' +
          '}}');
      });
      it('accepts meta sort order', () => {
        accepts('{$sort: {' +
          'field: {$meta: \'textScore\'}' +
          '}}');
      });
      it('accepts one field', () => {
        accepts('{$sort: {' +
          'field: 1,' +
          '}}');
      });
      it('rejects empty', () => {
        rejects('{$sort: {' +
          '}}');
      });
      it('rejects non-doc', () => {
        rejects('{$sort: "test"}');
      });
      it('rejects sort number not 1/-1 order', () => {
        rejects('{$sort: {' +
          'field: 100' +
          '}}');
      });
      it('rejects $meta without textScore order', () => {
        rejects('{$sort: {' +
          'field: {$meta: "notTextScore"' +
          '}}');
      });
      it('rejects non $meta document', () => {
        rejects('{$sort: {' +
          'field: {$notmeta: "TextScore"' +
          '}}');
      });
    });
    describe('$match', () => {
      it('accepts a simple document', () => {
        accepts('{$match: {' +
          'x: 1, y: {q: 1}, z: "testing"' +
          '}}');
      });
      it('accepts a nested field', () => {
        accepts('{$match: {' +
          '"x.y.z": 1, y: {q: 1}, z: "testing"' +
          '}}');
      });
      it('accepts $or', () => {
        accepts('{$match: {' +
          '$or: [{x:1}, {y: 1}]' +
          '}}');
      });
      it('accepts $and', () => {
        accepts('{$match: {' +
          '$and: [{z: 30}, {r: 99}]' +
          '}}');
      });
      it('accepts an empty document', () => {
        accepts('{$match: {' +
          '' +
          '}}');
      });
      it('accepts accumulators within $or', () => {
        accepts('{$match: {' +
            '$or: [' +
              '{ score: { $gt: 70, $lt: 90 } },' +
              '{ x: { $lt: 70 } }' +
            ']' +
          '}}');
      });
      it('accepts query operators', () => {
        accepts('{ $match: { x: { $gt: 70 } } }');
      });
      it('rejects field paths with $', () => {
        rejects('{ $match: { $x: 1 } }');
      });
    });
    describe('$project', () => {
      it('accepts a included field', () => {
        accepts('{$project: {' +
            'testfield: 1,' +
            'testfield2: true' +
          '}}');
      });
      it('accepts a excluded field', () => {
        accepts('{$project: {' +
          'testfield: 0,' +
          'testfield: false,' +
          '}}');
      });
      it('accepts a excluded _id field', () => {
        accepts('{$project: {' +
          '_id: 0,' +
          '}}');
      });
      it('accepts an agg expr', () => {
        accepts('{$project: {' +
          'field: {"$literal": "testing"},' +
          '}}');
      });
      it('accepts an arbitrary $ field', () => { // TODO: limit to defined operators
        accepts('{$project: {' +
          'field: {"$testing": "testing"},' +
          '}}');
      });
      it('accepts nested field', () => {
        accepts('{$project: {' +
          '"field.nested": {"$literal": "testing"},' + // TODO: need to be supported without quotation?
          '}}');
      });
      it('rejects empty doc', () => {
        rejects('{$project{}}');
      });
    });
    describe('$facet', () => {
      it('rejects empty object', () => {
        rejects('{$facet: {}}');
      });
      it('rejects a non-array for stage', () => {
        rejects('{$facet: {' +
          'output: {test: 1}' +
          '}}');
      });
      it('rejects an empty pipeline', () => {
        rejects('{$facet: {' +
          'output: []' +
          '}}');
      });
      it('accepts a pipeline', () => {
        accepts('{$facet: {' +
          '    "categorizedByTags": [' +
          '        { $unwind: "$tags" },' +
          '        { $sortByCount: "$tags" }' +
          '    ],' +
          '    "categorizedByPrice": [' +
          '        { $match: { price: { $exists: 1 } } },' +
          '        {' +
          '          $bucket: {' +
          '            groupBy: "$price",' +
          '            boundaries: [  0, 150, 200, 300, 400 ],' +
          '            default: "Other",' +
          '            output: {' +
          '              "count": { $sum: 1 },' +
          '              "titles": { $push: "$title" }' +
          '            }' +
          '          }' +
          '        }' +
          '    ],' +
          '    "categorizedByYears(Auto)": [' +
          '        {' +
          '          $bucketAuto: {' +
          '            groupBy: "$year",' +
          '            buckets: 4' +
          '          }' +
          '        }' +
          '    ]' +
          '}}');
      });
    });
  });

  describe('Query operators', () => {
    describe('$match', () => {
      it('accepts query operators', () => {
        accepts('{' +
          '$match: {' +
            '$or: [ ' +
              '{ score: { $gt: 70, $lt: 90 } },' +
              '{ views: { $gte: 1000 } } ' +
            '],' +
            '$and: [ ' +
              '{ score: { $gt: 70, $lt: 90 } },' +
              '{ views: { $gte: 1000 } } ' +
            '],' +
            'value: { $exists: "x" }' +
          '}' +
        '}');
      });
      it('accepts all operators', () => {
        accepts('{' +
          '$match: {' +
            'a: {$eq: 1}, b: {$gt: 1}, c: {$gte: 1}, d: {$in: 1}, e: {$lt: 1}, f: {$lte: 1}, g: {$ne: 1}, f: {$nin: 1},' +
            'g: {$and: 1}, h: {$or: 1}, i: {$not: 1}, j: {$nor: 1},' +
            'k: {$exists: 1}, l: {$type: 1},' +
            'm: {$expr: 1}, n: {$jsonSchema: 1}, o: {$mod: 1}, p: {$regex: 1}, q: {$text: 1}, r: {$where: 1},' +
            's: {$geoIntersects: 1}, t: {$geoWithin: 1},' +
            // 'v: {$nearSphere: 1}, u: {$near: 1},' + // TODO: FIX NEAR. Prevent $geoNear from taking $near in query.
            'w: {$all: 1}, x: {$elemMatch: 1}, y: {$size: 1},' +
            'z: {$bitsAllClear: 1}, a1: {$bitsAllSet: 1}, b1: {$bitsAnyClear: 1}, c1: {$bitsAnySet: 1},' +
            'd1: {$comment: 1},' +
            'e1: {$elemMatch: 1}, f1: {$meta: 1}, g1: {$slice: 1},' +
          '}}');
      });
      // it('accepts $near', () => {
      //   accepts('{' +
      //      '$match: {' +
      //       'location: {' +
      //         '$near: 1' +
      //         // '{' +
      //           // '$geometry: { type: "Point", coordinates: [ 100, 101] },' +
      //           // '$maxDistance: 100,' +
      //           // '$minDistance: 10' +
      //         // '}' +
      //        '}' +
      //      '}}'
      //   );
      // });
      it('rejects aggregation operators', () => {
        rejects('{' +
          '$match: {' +
              '$abs: 100' +
          '}}');
      });
      it('rejects field path', () => {
        rejects('{' +
          '$match: {' +
            '$field.subfield: 100' +
          '}}');
      });
    });
    describe('$geoNear', () => {
      it('accepts query operators', () => {
        accepts('{$geoNear: {' +
          'near: { type: "Point", coordinates: [ -73.99279 , 40.719296 ] },\n' +
          'distanceField: "dist.calculated",\n' +
          'maxDistance: 2,\n' +
          'query: {' +
          '$or: [ ' +
          '{ score: { $gt: 70, $lt: 90 } },' +
          '{ views: { $gte: 1000 } } ' +
          '],' +
          '$and: [ ' +
          '{ score: { $gt: 70, $lt: 90 } },' +
          '{ views: { $gte: 1000 } } ' +
          '],' +
          'value: { $exists: "x" }' +
          ' },\n' +
          'includeLocs: "dist.location",\n' +
          'num: 5,\n' +
          'spherical: true' +
          '}}');
      });
      it('rejects agg operators', () => {
        rejects('{$geoNear: {' +
          'near: { type: "Point", coordinates: [ -73.99279 , 40.719296 ] },\n' +
          'distanceField: "dist.calculated",\n' +
          'query: {' +
            '$abs: 100' +
          '},\n' +
          '}}');
      });
      it('rejects field path', () => {
        rejects('{$geoNear: {' +
          'near: { type: "Point", coordinates: [ -73.99279 , 40.719296 ] },\n' +
          'distanceField: "dist.calculated",\n' +
          'query: {' +
            '$fieldname.newField: 100' +
          '},\n' +
          '}}');
      });
      it('rejects $near', () => {
        rejects('{$geoNear: {' +
          'near: { type: "Point", coordinates: [ -73.99279 , 40.719296 ] },\n' +
          'distanceField: "dist.calculated",\n' +
          'query: {' +
            '$near: {' +
              '$geometry: {type: "Point" , coordinates: [ 100, 101] },' +
              '$maxDistance: 100,' +
              '$minDistance: 100' +
            '}' +
          '}}}');
      });
    });
  });

  describe('Invalid stage', () => {
    it('rejects an empty stage', () => {
      rejects('{}');
    });
    it('rejects a non-operator', () => {
      rejects('{$notanoperator: 1}');
    });
    it('rejects a missing $', () => {
      rejects('{sort: 1}');
    });
    it('rejects constants for complex operators', () => {
      rejects('{$addFields: 1}');
    });
    it('rejects a pipeline', () => {
      rejects('[{$match: {x: 1}}, {$sort: 1}]');
    });
  });
});

