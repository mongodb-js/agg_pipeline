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
  });

  describe('expressions with fieldnames', () => {
    describe('$addFields', () => {
      it('accepts multiple fields', () => {
        accepts('{$addFields: {' +
          'field1: "value1",' +
          'field2: 1,' +
          'field3: {x: 1},' +
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
    // it('rejects a ', () => {
    //   rejects('');
    // });
  });
});

