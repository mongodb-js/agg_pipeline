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
  describe('Aggregation operators', () => {
    // Constants
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

    // Simple expressions
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
        accepts('{$sortByCount: {$eq: "$testing"}}');
      });
    });

    describe('$redact', () => {
      it('accepts $cond', () => {
        accepts('{$redact: {' +
          '   $cond: {\n' +
          '     if: {' +
          '       $eq: [ "$level", 5 ]' +
          '     },\n' +
          '     then: "$$PRUNE",\n' +
          '     else: "$$DESCEND"\n' +
          '    }' +
          '}}');
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

    // Expressions with only required, defined fields
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

    // Expressions with both required and optional defined fields
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
          '   latencyStats: {histograms: true},' +
          '   storageStats: {},' +
          '   count: {}' +
          '}}'
        );
      });
      it('rejects nonempty count', () => {
        rejects('{ $collStats: {count: {test: 1}} }');
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
      it('accepts a regular doc', () => {
        accepts('{$graphLookup: { from: "employees", startWith: "$reportsTo",' +
          'connectFromField: "reportsTo", connectToField: "name",' +
          'as: "reportingHierarchy",' +
          'restrictSearchWithMatch: {x: 1}}}');
        accepts('{$graphLookup: { from: "employees", startWith: "$reportsTo",' +
          'connectFromField: "reportsTo", connectToField: "name",' +
          'as: "reportingHierarchy",' +
          'restrictSearchWithMatch: {"x": 1}}}');
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
      it('rejects a $ in output field', () => {
        rejects('{$bucket: {' +
          'groupBy: "$fieldname",' +
          'boundaries: [{$literal: {x:1}}, {$literal: {x:2}}],' +
          'default: "a string",' +
          'output: { $output1: {$sum: 1}, output2: {$avg: 1} }' +
          '}}');
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

    // Expressions that have defined fields that can be more than one type
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
    describe('$listLocalSessions', () => {
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

    describe('$listSessions', () => {
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

    // Expressions without predefined fields
    describe('$addFields', () => {
      it('accepts multiple fields', () => {
        accepts('{$addFields: {' +
          'field1: "value1",' +
          'field2: 1,' +
          '"field3": {x: 1},' +
          '}}');
      });
      it('accepts one field', () => {
        accepts('{$addFields: {' +
          'field1: "value1"' +
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
        it('accepts a nested field', () => {
          accepts('{$addFields: {' +
            '   field1.subfield: {$abs: 100},' +
            '}}');
        });
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
      it('accepts all 3 top-level options', () => {
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
          '   field: {"$literal": "testing"},' +
          '}}');
      });
      it('rejects an arbitrary $ field', () => { // TODO: limit to defined operators
        rejects('{$project: {' +
          'field: {"$testing": "testing"},' +
          '}}');
      });
      it('accepts nested field', () => {
        accepts('{$project: {' +
          '"field.nested": "$new.field.name",' +
          '}}');
      });
      it('accepts nested field without quotes', () => {
        accepts('{$project: {' +
          'field.nested: {"$literal": "testing"},' +
          '}}');
      });
      it('accepts fields with whitespace', () => {
        accepts('{$project: {' +
          '"    fie   ld.nm   ested    ": "$new.field.name",' +
          '}}');
      });
      it('accepts backslashes', () => {
        accepts('{$project: {' +
          '"field\?": "$new.field.name",' +
          '}}');
      });
      it('rejects empty doc', () => {
        rejects('{$project: {}}');
      });
      it('rejects both excluding and including fields', () => {
        rejects('{$project: {field: true, field2: false}}');
      });
      it('accepts excluding id and including other field', () =>{
        accepts('{$project: {field: true, _id: false}}');
      });
      it('accepts a cond exclude', () => {
        accepts('{\n' +
          '      $project: {\n' +
          '         title: 1,\n' +
          '         "author.first": 1,\n' +
          '         "author.last" : 1,\n' +
          '         "author.middle": {\n' +
          '            $cond: {\n' +
          '               if: { $eq: [ "", "$author.middle" ] },\n' +
          '               then: "$$REMOVE",\n' +
          '               else: "$author.middle"\n' +
          '            }\n' +
          '         }\n' +
          '      }\n' +
          '   }');
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

  describe('Key syntax', () => {
    describe('field', () => {
      it('rejects fields starting with $', () => {
        rejects('{$addFields: {' +
          '   $field1: "value1",' +
          '}}');
        rejects('{$addFields: {' +
          '   \'$field1\': "value1",' +
          '}}');
        rejects('{$addFields: {' +
          '   "$field1": "value1",' +
          '}}');
      });
      it('rejects fields starting with .', () => {
        rejects('{$addFields: {' +
          '   .field1: "value1",' +
          '}}');
        rejects('{$addFields: {' +
          '   \'.field1\': "value1",' +
          '}}');
        rejects('{$addFields: {' +
          '   ".field1": "value1",' +
          '}}');
      });
      it('accepts a field with $ or . later on in quotes', () => {
        accepts('{$addFields: {' +
          '   \'t.fiel$d1\': "value1",' +
          '}}');
        accepts('{$addFields: {' +
          '   "t.field$1": "value1",' +
          '}}');
      });
      it('rejects a fieldname with space', () => {
        rejects('{' +
          '   addFields: {field name: 1' +
          '}}');
      });
      it('rejects a numerical fieldname', () => {
        rejects('{' +
          '   addFields: {11: 1' +
          '}}');
      });
      it('accepts a fieldname with space and quotes', () => {
        accepts('{$addFields: {' +
          '   "fiel d1": "value1"' +
          '}}');
      });
      it('accepts a fieldname with escaped characters', () => {
        accepts('{$addFields: {' +
          '   "\tfiel d\r1": "value1"' +
          '}}');
      });
      it('accepts a nested field name', () => {
        accepts('{$addFields: {' +
          '   "name.name2": "value1"' +
          '}}');
      });
      it('accepts an escaped double quote', () => {
        accepts('{$addFields: {' +
          '   "fiel\\"d1": "value1"' +
          '}}');
      });
      it('accepts an escaped single quote', () => {
        accepts('{$addFields: {' +
          "   'fiel\\'d1': 'value1'" +
          '}}');
      });
      it('accepts an double quote within single quotes', () => {
        accepts('{$addFields: {' +
          '   "fiel\'d1": "value1"' +
          '}}');
      });
      it('accepts an single quote within double quotes', () => {
        accepts('{$addFields: {' +
          '   \'fiel"d1\': "value1"' +
          '}}');
      });
      it('accepts unicode', () => {
        accepts('{$addFields: {' +
          '   "fiel☂d1": "value1"' +
          '}}');
      });
    });
    describe('object', () => {
      it('accepts an object', () => {
        accepts('{$lookup: {' +
          'from: "fromColl", localField: "inputField",' +
          'foreignField: "fromField", as: "outArray",' +
          'let: { test: "value" }' +
          '}}'
        );
      });
      it('rejects any operators', () => {
        rejects('{$lookup: {' +
          'from: "fromColl", localField: "inputField",' +
          'foreignField: "fromField", as: "outArray",' +
          'let: { $abs: 1 }' +
          '}}'
        );
      });
      it('rejects an array', () => {
        rejects('{$lookup: {' +
          'from: "fromColl", localField: "inputField",' +
          'foreignField: "fromField", as: "outArray",' +
          'let: [1,2]' +
          '}}'
        );
      });
      it('rejects a constant', () => {
        rejects('{$lookup: {' +
          'from: "fromColl", localField: "inputField",' +
          'foreignField: "fromField", as: "outArray",' +
          'let: 1' +
          '}}'
        );
      });
    });
    describe('query_expr', () => {
      it('accepts all operators', () => {
        accepts('{' +
          '$match: {' +
            'a: {$eq: 1}, b: {$gt: 1}, c: {$gte: 1}, d: {$in: 1}, e: {$lt: 1}, f: {$lte: 1}, g: {$ne: 1}, f: {$nin: 1},' +
            'g: {$and: 1}, h: {$or: 1}, i: {$not: 1}, j: {$nor: 1},' +
            'k: {$exists: 1}, l: {$type: 1},' +
            'm: {$expr: 1}, n: {$jsonSchema: 1}, o: {$mod: 1}, p: {$regex: 1}, q: {$text: 1}, r: {$where: 1},' +
            's: {$geoIntersects: 1}, t: {$geoWithin: 1},' +
            'v: {$nearSphere: 1}, u: {$near: 1},' +
            'w: {$all: 1}, x: {$elemMatch: 1}, y: {$size: 1},' +
            'z: {$bitsAllClear: 1}, a1: {$bitsAllSet: 1}, b1: {$bitsAnyClear: 1}, c1: {$bitsAnySet: 1},' +
            'd1: {$comment: 1},' +
            'e1: {$elemMatch: 1}, f1: {$meta: 1}, g1: {$slice: 1},' +
          '}}');
      });
      it('accepts one op with quotes', () => {
        accepts('{ $match: { x: {"$lte": 1} } }');
      });
      it('accepts $match $in with regex', () => {
        accepts('{ $match: { x: {"$in": [/abc/]} } }');
      });
      it('accepts $match $in $regex with regex', () => {
        accepts('{ $match: { x: {"$regex": /abc/} } }');
      });
      it('accepts all operators with double quotes', () => {
        accepts('{' +
          '$match: {' +
          'a: {"$eq": 1}, b: {"$gt": 1}, c: {"$gte": 1}, d: {"$in": 1}, e: {"$lt": 1}, f: {"$lte": 1}, g: {"$ne": 1}, f: {"$nin": 1},' +
          'g: {"$and": 1}, h: {"$or": 1}, i: {"$not": 1}, j: {"$nor": 1},' +
          'k: {"$exists": 1}, l: {"$type": 1},' +
          'm: {"$expr": 1}, n: {"$jsonSchema": 1}, o: {"$mod": 1}, p: {"$regex": 1}, q: {"$text": 1}, r: {"$where": 1},' +
          's: {"$geoIntersects": 1}, t: {"$geoWithin": 1},' +
          'v: {"$nearSphere": 1},' +
          'u: {"$near": 1},' +
          'w: {"$all": 1}, x: {"$elemMatch": 1}, y: {"$size": 1},' +
          'z: {"$bitsAllClear": 1}, a1: {"$bitsAllSet": 1}, b1: {"$bitsAnyClear": 1}, c1: {"$bitsAnySet": 1},' +
          'd1: {"$comment": 1},' +
          'e1: {"$elemMatch": 1}, f1: {"$meta": 1}, g1: {"$slice": 1},' +
          '}}');
      });
      it('accepts all operators with single quotes', () => {
        accepts('{' +
          '$match: {' +
          'a: {\'$eq\': 1}, b: {\'$gt\': 1}, c: {\'$gte\': 1}, d: {\'$in\': 1}, e: {\'$lt\': 1}, f: {\'$lte\': 1}, g: {\'$ne\': 1}, f: {\'$nin\': 1},' +
          'g: {\'$and\': 1}, h: {\'$or\': 1}, i: {\'$not\': 1}, j: {\'$nor\': 1},' +
          'k: {\'$exists\': 1}, l: {\'$type\': 1},' +
          'm: {\'$expr\': 1}, n: {\'$jsonSchema\': 1}, o: {\'$mod\': 1}, p: {\'$regex\': 1}, q: {\'$text\': 1}, r: {\'$where\': 1},' +
          's: {\'$geoIntersects\': 1}, t: {\'$geoWithin\': 1},' +
          'v: {\'$nearSphere\': 1},' +
          'u: {\'$near\': 1},' +
          'w: {\'$all\': 1}, x: {\'$elemMatch\': 1}, y: {\'$size\': 1},' +
          'z: {\'$bitsAllClear\': 1}, a1: {\'$bitsAllSet\': 1}, b1: {\'$bitsAnyClear\': 1}, c1: {\'$bitsAnySet\': 1},' +
          'd1: {\'$comment\': 1},' +
          'e1: {\'$elemMatch\': 1}, f1: {\'$meta\': 1}, g1: {\'$slice\': 1},' +
          '}}');
      });
      it('rejects aggregation operators', () => {
        rejects('{' +
          '$match: {' +
              '$abs: 100' +
          '}}');
      });
      it('rejects nested aggregation operators', () => {
        rejects('{' +
          '$match: {' +
          '   x: {$abs: 100}' +
          '}}');
      });
      it('accepts non-operator fields', () => {
        accepts('{' +
          '$match: {x: 100}}');
      });
    });
    describe('agg_expr', () => {
      it('accepts all operators without quotes part 1', () => {
        accepts('{$addFields: {' +
          '   a2: {$abs: 1}, a3: {$cond: 1}, a4: {$gt: 1}, a5: {$gte: 1}, a6: {$lt: 1}, a7: {$lte: 1}, a8: {$in: 1},' +
          '   a: {$addToSet: 1}, q: {$and: 1}, w: {$avg: 1}, e: {$eq: 1}, r: {$first: 1},' +
          '   t: {$gte: 1}, y: {$gt: 1}, u: {$lte: 1}, i: {$lt: 1}, o: {$in: 1},' +
          '   p: {$last: 1}, a: {$meta: 1}, s: {$max: 1}, d: {$min: 1}, f: {$mod: 1},' +
          '   g: {$ne: 1}, h: {$not: 1}, j: {$or: 1}, j2: {$push: 1}, k: {$size: 1},' +
          '   l: {$slice: 1}, z: {$stdDevPop: 1}, x: {$stdDevSamp: 1}, c: {$sum: 1},' +
          '   v: {$type: 1}, v2: {$abs: 1}, b: {$add: 1}, n: {$allElementsTrue: 1}, ' +
          '   m: {$anyElementTrue: 1}, m1: {$arrayElemAt: 1}, 11: {$arrayToObject: 1},' +
          '   2: {$ceil: 1}, 3: {$cmp: 1}, 4: {$concatArrays: 1}, 5: {$concat: 1},' +
          '   6: {$dateFromParts: 1}, 7: {$dateFromString: 1}, 8: {$dateToString: 1},' +
          '   9: {$dateToParts: 1}, 0: {$dayOfMonth: 1}, ' +
          '}}');
      });
      it('accepts all operators part 1 with double quotes', () => {
        accepts('{$addFields: {' +
          '   a2: {"$abs": 1}, a3: {"$cond": 1}, a4: {"$gt": 1}, a5: {"$gte": 1}, a6: {"$lt": 1}, a7: {"$lte": 1}, a8: {"$in": 1},' +
          '   a: {"$addToSet": 1}, q: {"$and": 1}, w: {"$avg": 1}, e: {"$eq": 1}, r: {"$first": 1},' +
          '   t: {"$gte": 1}, y: {"$gt": 1}, u: {"$lte": 1}, i: {"$lt": 1}, o: {"$in": 1},' +
          '   p: {"$last": 1}, a: {"$meta": 1}, s: {"$max": 1}, d: {"$min": 1}, f: {"$mod": 1},' +
          '   g: {"$ne": 1}, h: {"$not": 1}, j: {"$or": 1}, j2: {"$push": 1}, k: {"$size": 1},' +
          '   l: {"$slice": 1}, z: {"$stdDevPop": 1}, x: {"$stdDevSamp": 1}, c: {"$sum": 1},' +
          '   v: {"$type": 1}, v2: {"$abs": 1}, b: {"$add": 1}, n: {"$allElementsTrue": 1}, ' +
          '   m: {"$anyElementTrue": 1}, m1: {"$arrayElemAt": 1}, 11: {"$arrayToObject": 1},' +
          '   2: {"$ceil": 1}, 3: {"$cmp": 1}, 4: {"$concatArrays": 1}, 5: {"$concat": 1},' +
          '   6: {"$dateFromParts": 1}, 7: {"$dateFromString": 1}, 8: {"$dateToString": 1},' +
          '   9: {"$dateToParts": 1}, 0: {"$dayOfMonth": 1}, ' +
          '}}');
      });
      it('accepts all operators part 1 with single quotes', () => {
        accepts('{$addFields: {' +
          '   a2: {\'$abs\': 1}, a3: {\'$cond\': 1}, a4: {\'$gt\': 1}, a5: {\'$gte\': 1}, a6: {\'$lt\': 1}, a7: {\'$lte\': 1}, a8: {\'$in\': 1},' +
          '   a: {\'$addToSet\': 1}, q: {\'$and\': 1}, w: {\'$avg\': 1}, e: {\'$eq\': 1}, r: {\'$first\': 1},' +
          '   t: {\'$gte\': 1}, y: {\'$gt\': 1}, u: {\'$lte\': 1}, i: {\'$lt\': 1}, o: {\'$in\': 1},' +
          '   p: {\'$last\': 1}, a: {\'$meta\': 1}, s: {\'$max\': 1}, d: {\'$min\': 1}, f: {\'$mod\': 1},' +
          '   g: {\'$ne\': 1}, h: {\'$not\': 1}, j: {\'$or\': 1}, j2: {\'$push\': 1}, k: {\'$size\': 1},' +
          '   l: {\'$slice\': 1}, z: {\'$stdDevPop\': 1}, x: {\'$stdDevSamp\': 1}, c: {\'$sum\': 1},' +
          '   v: {\'$type\': 1}, v2: {\'$abs\': 1}, b: {\'$add\': 1}, n: {\'$allElementsTrue\': 1}, ' +
          '   m: {\'$anyElementTrue\': 1}, m1: {\'$arrayElemAt\': 1}, 11: {\'$arrayToObject\': 1},' +
          '   2: {\'$ceil\': 1}, 3: {\'$cmp\': 1}, 4: {\'$concatArrays\': 1}, 5: {\'$concat\': 1},' +
          '   6: {\'$dateFromParts\': 1}, 7: {\'$dateFromString\': 1}, 8: {\'$dateToString\': 1},' +
          '   9: {\'$dateToParts\': 1}, 0: {\'$dayOfMonth\': 1}, ' +
          '}}');
      });
      it('accepts all operators part 2', () => {
        accepts('{$addFields: {' +
          '   q: {$dayOfWeek: 1}, w: {$dayOfYear: 1}, e: {$divide: 1}, r: {$exp: 1},' +
          '   t: {$filter: 1}, y: {$floor: 1}, u: {$hour: 1}, i: {$ifNull: 1}, a1: {$isArray: 1},' +
          '   o: {$indexOfBytes: 1}, p: {$indexOfArray: 1}, a: {$indexOfCP: 1},' +
          '   s: {$isoDayOfWeek: 1}, d: {$isoWeek: 1}, f: {$isoWeekYear: 1}, ' +
          '   g: {$let: 1}, g1: {$literal: 1}, h: {$ln: 1}, j: {$log10: 1}, ' +
          '   k: {$log: 1}, l: {$map: 1}, z: {$mergeObjects: 1}, z1: {$millisecond: 1},' +
          '   x: {$minute: 1}, c: {$month: 1}, v: {$multiply: 1}, b: {$objectToArray: 1}, ' +
          '   n: {$pow: 1}, m: {$range: 1}, m2: {$reduce: 1}, 1: {$reverseArray: 1},' +
          '   2: {$second: 1}, 3: {$setDifference: 1}, 4: {$setEquals: 1}, 5: {$setIntersection: 1},' +
          '   6: {$setIsSubset: 1}, 7: {$setUnion: 1}, 8: {$split: 1}, 9: {$sqrt: 1},' +
          '   0: {$strcasecmp: 1}, 11: {$strLenBytes: 1}, 22: {$strLenCP: 1},' +
          '   33: {$substrBytes: 1}, 44: {$substrCP: 1}, 55: {$substr: 1}, ' +
          '   77: {$subtract: 1}, 88: {$switch: 1}, 99: {$toLower: 1}, ' +
          '   aa: {$toUpper: 1}, ss: {$trunc: 1}, dd: {$week: 1}, ff: {$year: 1},' +
          '   gg: {$zip: 1} ' +
          '}}');
      });
      it('accepts all operators part 2 with double quotes', () => {
        accepts('{$addFields: {' +
          '   q: {"$dayOfWeek": 1}, w: {"$dayOfYear": 1}, e: {"$divide": 1}, r: {"$exp": 1},' +
          '   t: {"$filter": 1}, y: {"$floor": 1}, u: {"$hour": 1}, i: {"$ifNull": 1}, a1: {"$isArray": 1},' +
          '   o: {"$indexOfBytes": 1}, p: {"$indexOfArray": 1}, a: {"$indexOfCP": 1},' +
          '   s: {"$isoDayOfWeek": 1}, d: {"$isoWeek": 1}, f: {"$isoWeekYear": 1}, ' +
          '   g: {"$let": 1}, g1: {"$literal": 1}, h: {"$ln": 1}, j: {"$log10": 1}, ' +
          '   k: {"$log": 1}, l: {"$map": 1}, z: {"$mergeObjects": 1}, z1: {"$millisecond": 1},' +
          '   x: {"$minute": 1}, c: {"$month": 1}, v: {"$multiply": 1}, b: {"$objectToArray": 1}, ' +
          '   n: {"$pow": 1}, m: {"$range": 1}, m2: {"$reduce": 1}, 1: {"$reverseArray": 1},' +
          '   2: {"$second": 1}, 3: {"$setDifference": 1}, 4: {"$setEquals": 1}, 5: {"$setIntersection": 1},' +
          '   6: {"$setIsSubset": 1}, 7: {"$setUnion": 1}, 8: {"$split": 1}, 9: {"$sqrt": 1},' +
          '   0: {"$strcasecmp": 1}, 11: {"$strLenBytes": 1}, 22: {"$strLenCP": 1},' +
          '   33: {"$substrBytes": 1}, 44: {"$substrCP": 1}, 55: {"$substr": 1}, ' +
          '   77: {"$subtract": 1}, 88: {"$switch": 1}, 99: {"$toLower": 1}, ' +
          '   aa: {"$toUpper": 1}, ss: {"$trunc": 1}, dd: {"$week": 1}, ff: {"$year": 1},' +
          '   gg: {"$zip": 1} ' +
          '}}');
      });
      it('accepts all operators part 2 with single quotes', () => {
        accepts('{$addFields: {' +
          '   q: {\'$dayOfWeek\': 1}, w: {\'$dayOfYear\': 1}, e: {\'$divide\': 1}, r: {\'$exp\': 1},' +
          '   t: {\'$filter\': 1}, y: {\'$floor\': 1}, u: {\'$hour\': 1}, i: {\'$ifNull\': 1}, a1: {\'$isArray\': 1},' +
          '   o: {\'$indexOfBytes\': 1}, p: {\'$indexOfArray\': 1}, a: {\'$indexOfCP\': 1},' +
          '   s: {\'$isoDayOfWeek\': 1}, d: {\'$isoWeek\': 1}, f: {\'$isoWeekYear\': 1}, ' +
          '   g: {\'$let\': 1}, g1: {\'$literal\': 1}, h: {\'$ln\': 1}, j: {\'$log10\': 1}, ' +
          '   k: {\'$log\': 1}, l: {\'$map\': 1}, z: {\'$mergeObjects\': 1}, z1: {\'$millisecond\': 1},' +
          '   x: {\'$minute\': 1}, c: {\'$month\': 1}, v: {\'$multiply\': 1}, b: {\'$objectToArray\': 1}, ' +
          '   n: {\'$pow\': 1}, m: {\'$range\': 1}, m2: {\'$reduce\': 1}, 1: {\'$reverseArray\': 1},' +
          '   2: {\'$second\': 1}, 3: {\'$setDifference\': 1}, 4: {\'$setEquals\': 1}, 5: {\'$setIntersection\': 1},' +
          '   6: {\'$setIsSubset\': 1}, 7: {\'$setUnion\': 1}, 8: {\'$split\': 1}, 9: {\'$sqrt\': 1},' +
          '   0: {\'$strcasecmp\': 1}, 11: {\'$strLenBytes\': 1}, 22: {\'$strLenCP\': 1},' +
          '   33: {\'$substrBytes\': 1}, 44: {\'$substrCP\': 1}, 55: {\'$substr\': 1}, ' +
          '   77: {\'$subtract\': 1}, 88: {\'$switch\': 1}, 99: {\'$toLower\': 1}, ' +
          '   aa: {\'$toUpper\': 1}, ss: {\'$trunc\': 1}, dd: {\'$week\': 1}, ff: {\'$year\': 1},' +
          '   gg: {\'$zip\': 1} ' +
          '}}');
      });
      it('rejects query operators', () => {
        rejects('{' +
          '$addFields: {' +
          '   x: {$regex: 100}' +
          '}}');
        rejects('{' +
          '$addFields: {' +
          '   x: {"$regex": 100}' +
          '}}');
        rejects('{' +
          '$addFields: {' +
          '   x: {\'$regex\': 100}' +
          '}}');
      });
      it('accepts accumulators', () => {
        accepts('{' +
          '$addFields: {' +
          '   x: {$sum: 100}' +
          '}}');
        accepts('{' +
          '$addFields: {' +
          '   x: {"$sum": 100}' +
          '}}');
        accepts('{' +
          '$addFields: {' +
          '   x: {\'$sum\': 100}' +
          '}}');
      });
      it('rejects nested query operators', () => {
        rejects('{' +
          '$addFields: {' +
          '   x: { y: {$regex: 100}}' +
          '}}');
      });
      it('accepts non-operator fields', () => {
        accepts('{$addFields: {x: 100}}');
      });
      it('rejects arbitrary $', () => {
        rejects('{' +
        '$addFields: {' +
        '   x: {$otherfield: 100}' +
        '}}');
        rejects('{' +
          '$addFields: {' +
          '   x: {"$otherfield": 100}' +
          '}}');
        rejects('{' +
          '$addFields: {' +
          '   x: {\'$otherfield\': 100}' +
          '}}');
      });
    });
  });

  describe('Extended JSON Syntax', () => {
    it('accepts Code', () => {
      accepts('{ $addFields: { x: Code("xxx") } }');
    });
    it('accepts ObjectId', () => {
      accepts('{ $addFields: {' +
        '   x: ObjectId("53c2b570c15c457669f481f7"),' +
        '   x: ObjectId(\'53c2b570c15c457669f481f7\'),' +
        '   x: ObjectId(53c2b570c15c457669f481f7),' +
        '}}');
    });
    it('accepts Binary', () => {
      accepts('{ $addFields: { x: Binary("SGVs\)bG8gV29ybGQ=", "0"), y: 1 } }');
    });
    it('accepts DbRef', () => {
      accepts('{ $addFields: { x: DBRef("name", ObjectId(1)) } }');
    });
    it('accepts Timestamp', () => {
      accepts('{ $addFields: { x: Timestamp(3456789, NumberInt(100)) } }');
    });
    it('accepts NumberLong', () => {
      accepts('{ $addFields: { x: NumberLong("23456789") } }');
    });
    it('accepts NumberInt', () => {
      accepts('{ $addFields: { x: NumberInt(234567890) } }');
    });
    it('accepts NumberDecimal', () => {
      accepts('{ $addFields: { x: NumberDecimal(234567.23456789) } }');
    });
    it('accepts MaxKey', () => {
      accepts('{ $addFields: { x: MaxKey() } }');
    });
    it('accepts MinKey', () => {
      accepts('{ $addFields: { x: MinKey() } }');
    });
    it('accepts Date', () => {
      accepts('{ $addFields: { x: Date(\'1999-01-01\') } }');
    });
    it('accepts ISODate', () => {
      accepts('{ $addFields: { x: ISODate(\'2007-05-25 08:51:27.000\') } }');
    });
    it('accepts RegExp', () => {
      accepts('{ $addFields: { x: RegExp(\'/^[a-z0-9_-]{3,16}$/)\'))) } }');
    });
    it('accepts Undefined', () => {
      accepts('{ $addFields: { x: Undefined() } }');
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
    it('rejects text', () => {
      rejects('a pipeline');
    });
  });
});

