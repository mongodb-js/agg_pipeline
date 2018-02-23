const chai = require('chai');
const expect = chai.expect;
const parse = require('../lib').parse;

describe('#parse', () => {
  function accepts(obj) {
    const str = JSON.stringify(obj);
    const ast = parse(str);
    expect(ast).to.deep.equal(obj);
  }

  describe('#accepts', () => {
    describe('constants', () => {
      // Constants
      it('$limit accepts a positive integer', () => {
        accepts({'$limit': 1});
      });
      it('$count accepts a string', () => {
        accepts({'$count': 'id field'});
      });
      it('$skip accepts a positive integer', () => {
        accepts({'$skip': 10});
      });
      it('$out accepts a string', () => {
        accepts({'$out': 'coll'});
      });
      it('$indexStats accepts an empty document', () => {
        accepts({'$indexStats': {}});
      });
    });
  });

  describe('simple expr', () => {
    it('$sortByCount returns a constant', () => {
      accepts({'$sortByCount': '$field'});
    });
    it('$sortByCount returns a constant expr', () => {
      accepts({'$sortByCount': {'$eq': '$testing'}});
    });
    it('$sortByCount returns an object expr', () => {
      accepts({'$sortByCount': {'$eq': {x: '$testing'}}});
    });
    it('$sortByCount returns an array expr', () => {
      accepts({'$sortByCount': {'$mergeObjects': ['$test', '$test2']}});
    });
    it('$redact returns a sys var', () => {
      accepts({'$redact': '$$PRUNE'});
      accepts({'$redact': '$$DESCEND'});
      accepts({'$redact': '$$KEEP'});
    });
    it('$redact returns mixed expr', () => {
      accepts(
        {'$redact': {
          '$cond': {
            if: {
              '$eq': [ '$level', 5 ]
            },
            then: '$$PRUNE',
            else: '$$DESCEND'
          }
        }});
    });
    it('$sample a doc with size', () => {
      accepts({ '$sample': { size: 10 } });
    });
    it('$sample returns a doc with "size"', () => {
      accepts({ '$sample': { 'size': 10 } });
    });
    it('$replaceRoot returns a doc with newRoot', () => {
      accepts({ '$replaceRoot': { newRoot: {x: 10} } });
    });
    it('$replaceRoot returns a doc with empty newRoot', () => {
      accepts({ '$replaceRoot': { newRoot: {} } });
    });
    it('$replaceRoot returns a doc with "newRoot"', () => {
      accepts({ '$replaceRoot': { 'newRoot': {x: 10} } });
    });
    it('$replaceRoot returns an agg expr', () => {
      accepts({ '$replaceRoot': { 'newRoot': {'$abs': 10} } });
    });
  });

  describe('mix of optional and required fields', () => {
    it('$collStats returns an empty doc', () => {
      accepts({ '$collStats': {} });
    });
    it('$collStats returns just latencyStats', () => {
      accepts({ '$collStats': { latencyStats: {histograms: true}}});
    });
    it('$collStats returns just storageStats', () => {
      accepts({'$collStats': { storageStats: {}}});
    });
    it('$collStats returns all fields', () => {
      accepts(
        {'$collStats': {
          latencyStats: {histograms: true},
          storageStats: {},
          count: {}
        }}
      );
    });
    it('$currentOp returns an empty doc', () => {
      accepts({ '$currentOp': {} });
    });
    it('$currentOp returns just allUsers', () => {
      accepts({ '$currentOp': { allUsers: true }});
    });
    it('$currentOp returns just idleConnections', () => {
      accepts({'$currentOp': { idleConnections: false }});
    });
    it('$currentOp returns all fields', () => {
      accepts(
        {'$currentOp': { allUsers: true, idleConnections: false }}
      );
    });
    it('$lookup returns full doc', () => {
      accepts(
        {'$lookup': {
          from: 'fromColl', localField: 'inputField',
          foreignField: 'fromField', as: 'outArray'
        }}
      );
    });
    it('supports let and pipeline', () => {
      // accepts(
      //   {'$lookup':
      //     {
      //       from: "warehouses",
      //       let: { order_item: "$item", order_qty: "$ordered" },
      //       pipeline: [
      //          { '$match':
      //             { '$expr':
      //                { '$and':
      //                   [
      //                     { '$eq': [ "$stock_item",  "$$order_item" ] },
      //                     { '$gte': [ "$instock", "$$order_qty" ] }
      //                   ]
      //                }
      //             }
      //          },
      //          { '$project': { stock_item: 0, _id: 0 } }
      //       ],
      //       as: "stockdata"
      //     }
      //   });
      // accepts({
      //   '$lookup': { from: "warehouses", let: { order_item: "$item", order_qty: "$ordered"  }, pipeline: [{ '$match': { '$expr': { '$and': [{ '$eq': [ "$stock_item",  "$$order_item" ] }, { '$gte': [ "$instock", "$$order_qty" ] } ] } } }, { '$project': { stock_item: 0, _id: 0 } } ], as: "stockdata" }
      // });
    });
    it('$geoNear returns full doc', () => {
      accepts(
        {'$geoNear': {
          minDistance: 10.1,
          distanceField: 'toField',
          spherical: true,
          limit: 100,
          num: 100,
          uniqueDocs: true,
          maxDistance: 100,
          query: {x: 1},
          distanceMultiplier: 100,
          includeLocs: 'outputfield',
          near: {type: 'Point', coordinates: [10.01, 9.99]}
        }});
    });
    it('$geoNear returns the two required', () => {
      accepts(
        {'$geoNear': {
          near: {type: 'Point', coordinates: [10.01, 9.99]},
          distanceField: 'field' }});
    });
    it('$geoNear returns legacy coordinates', () => {
      accepts(
        {'$geoNear': {
          near: [ 10.0001, -33.01 ],
          distanceField: 'field'
        }});
    });

    it('$group returns a group with _id', () => {
      accepts({ '$group': { _id: 1, field1: { '$sum': 'field' } } });
    });
    it('$group returns an agg expr for _id', () => {
      accepts({ '$group': { _id: {'$abs': 1}, field1: { '$sum': 'field' } } });
    });
    it('$group returns an agg expr for accumulator', () => {
      accepts(
        { '$group': { _id: {'$abs': 1}, field1: { '$sum': {'$abs': 1} } } });
    });
    it('$graphLookup returns min doc', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: '$reportsTo',
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy'
      }});
    });
    it('$graphLookup returns full doc', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: '$reportsTo',
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy',
        maxDepth: 100,
        depthField: 'fieldname',
        restrictSearchWithMatch: {x: 1}
      }});
    });
    it('$graphLookup returns an expression for startWith', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: {'$abs': 1},
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy'
      }});
    });
    it('$graphLookup returns an array for startWith', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: ['f1', 'f2'],
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy'
      }});
    });
    it('$graphLookup returns an array for connectToField', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: ['f1', 'f2'],
        connectFromField: 'reportsTo',
        connectToField: ['name', 'name2'],
        as: 'reportingHierarchy'
      }});
    });
    it('$graphLookup returns query expr for restrictSearchWithMatch', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: '$reportsTo',
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy',
        restrictSearchWithMatch: {x: {'$gt': 1}}
      }});
    });
    it('$graphLookup returns a regular doc', () => {
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: '$reportsTo',
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy',
        restrictSearchWithMatch: {x: 1}}});
      accepts({'$graphLookup': {
        from: 'employees',
        startWith: '$reportsTo',
        connectFromField: 'reportsTo',
        connectToField: 'name',
        as: 'reportingHierarchy',
        restrictSearchWithMatch: {'x': 1}}});
    });
    it('$bucket returns min doc', () => {
      accepts({'$bucket': {
        groupBy: '$fieldname',
        boundaries: [1, 2]
      }});
    });
    it('$bucket returns an agg expr for groupBy', () => {
      accepts({'$bucket': {
        groupBy: {'$abs': 1},
        boundaries: [1, 2]
      }});
    });
    it('$bucket returns full doc', () => {
      accepts({'$bucket': {
        groupBy: '$fieldname',
        boundaries: [1, 2],
        default: 'a string',
        output: { output1: {'$sum': 1}, output2: {'$avg': 1} }
      }});
    });
    it('$bucket returns literal in boundaries', () => {
      accepts({'$bucket': {
        groupBy: '$fieldname',
        boundaries: [{'$literal': {x: 1}}, {'$literal': {x: 2}}],
        default: 'a string',
        output: { output1: {'$sum': 1}, output2: {'$avg': 1} }
      }});
    });
    it('$bucket returns test doc', () => {
      accepts({
        '$bucket': {
          groupBy: '$price',
          boundaries: [ 0, 150, 200, 300, 400 ],
          default: 'Other',
          output: {
            'count': { '$sum': 1 },
            'titles': { '$push': '$title' }
          }}
      });
    });
    it('$bucketAuto returns min doc', () => {
      accepts({'$bucketAuto': {
        groupBy: '$fieldname',
        buckets: 10
      }});
    });
    it('$bucketAuto returns an agg expr for groupBy', () => {
      accepts({'$bucketAuto': {
        groupBy: {'$abs': 1},
        buckets: 10
      }});
    });
    it('$bucketAuto returns full doc', () => {
      accepts({'$bucketAuto': {
        groupBy: '$fieldname',
        buckets: 10,
        granularity: 'R80',
        output: { output1: {'$sum': 1}, output2: {'$avg': 1} }
      }});
    });
    it('$bucketAuto returns literal in boundaries', () => {
      accepts({'$bucketAuto': {
        groupBy: '$fieldname',
        buckets: 10,
        granularity: 'R80',
        output: { output1: {'$sum': 1}, output2: {'$avg': 1} }
      }});
    });
  });

  describe('expressions with more than one option', () => {
    it('returns a field path', () => {
      accepts({ '$unwind': '$fieldpath' });
    });
    it('returns full document', () => {
      accepts(
        {
          '$unwind': {
            path: '$fieldpath',
            includeArrayIndex: 'newField',
            preserveNullAndEmptyArrays: false
          }
        }
      );
    });
    it('returns an empty doc', () => {
      accepts({'$listLocalSessions': {}});
    });
    it('$listLocalSessions returns allUsers', () => {
      accepts({'$listLocalSessions': {allUsers: true}});
    });
    it('$listLocalSessions returns one user/db', () => {
      accepts({'$listLocalSessions': {
        users: [
          { user: 'anna', db: 'test'}
        ]
      }});
    });
    it('$listLocalSessions returns multiple user/db', () => {
      accepts({'$listLocalSessions': {users: [
        {user: 'anna', db: 'test'}, {user: 'sara', db: 'test2'}]}});
    });
    it('$listSessions returns an empty doc', () => {
      accepts({'$listSessions': {}});
    });
    it('$listSessions returns allUsers', () => {
      accepts({'$listSessions': {allUsers: true}});
    });
    it('$listSessions returns one user/db', () => {
      accepts({'$listSessions': {users: [
        {user: 'anna', db: 'test'}]}});
    });
    it('$listSessions returns multiple user/db', () => {
      accepts({'$listSessions': {
        users: [{user: 'anna', db: 'test'}, {user: 'sara', db: 'test2'}]}});
    });
  });

  describe('expressions with unnamed fields', () => {
    it('$addFields returns multiple fields', () => {
      accepts({'$addFields': {
        field1: 'value1',
        field2: 1,
        field3: {x: 1}
      }});
    });
    it('$addFields returns one field', () => {
      accepts({'$addFields': {
        field1: 'value1'
      }});
    });
    it('$addFields returns agg expr', () => {
      accepts({'$addFields': {
        field1: {$abs: 100}
      }});
    });
    it('$addFields returns a nested field', () => {
      accepts({'$addFields': {
        'field1.subfield': {'$abs': 100}
      }});
    });
    it('$sort returns multiple fields', () => {
      accepts({'$sort': {
        field1: 1,
        field2: -1,
        field3: {$meta: 'textScore'}
      }});
    });
    it('$sort returns meta sort order', () => {
      accepts({'$sort': {
        field: {'$meta': 'textScore'}
      }});
    });
    it('$sort returns one field', () => {
      accepts({'$sort': {
        field: 1
      }});
    });
    it('$match returns a simple document', () => {
      accepts({'$match': {
        x: 1, y: {q: 1}, z: 'testing'
      }});
    });
    it('$match returns a nested field', () => {
      accepts({'$match': {
        'x.y.z': 1, y: {q: 1}, z: 'testing'
      }});
    });
    it('$match returns $or', () => {
      accepts({'$match': {
        '$or': [{x: 1}, {y: 1}]
      }});
    });
    it('$match returns $and', () => {
      accepts({'$match': {
        '$and': [{z: 30}, {r: 99}]
      }});
    });
    it('$match returns $expr', () => {
      accepts({'$match': {
        '$expr': [{z: 30}, {r: 99}]
      }});
    });
    it('$match returns an empty document', () => {
      accepts({'$match': {}});
    });
    it('$match returns accumulators within $or', () => {
      accepts({'$match': {
        '$or': [
          { score: { '$gt': 70, '$lt': 90 } },
          { x: { '$lt': 70 } }
        ]
      }});
    });
    it('$match returns query operators', () => {
      accepts({ '$match': { x: { '$gt': 70 } } });
    });
    it('$match returns all 3 top-level options', () => {
      accepts({
        '$match': {
          '$or': [
            { score: { '$gt': 70, '$lt': 90 } },
            { views: { '$gte': 1000 } }
          ],
          '$and': [
            { score: { '$gt': 70, '$lt': 90 } },
            { views: { '$gte': 1000 } }
          ],
          value: { '$exists': 'x' }
        }
      });
    });
    it('$project returns a included field', () => {
      accepts({'$project': {
        testfield: 1,
        testfield2: true
      }});
    });
    it('$project returns a excluded field', () => {
      accepts({'$project': {
        testfield: 0,
        testfield2: false
      }});
    });
    it('$project returns a excluded _id field', () => {
      accepts({'$project': {
        _id: 0
      }});
    });
    it('$project returns an agg expr', () => {
      accepts({'$project': {
        field: {'$literal': 'testing'}
      }});
    });
    it('$project returns nested field', () => {
      accepts({'$project': {
        'field.nested': '$new.field.name'
      }});
    });
    it('$project returns nested field without quotes', () => {
      accepts({'$project': {
        'field.nested': {'$literal': 'testing'}
      }});
    });
    it('$project returns fields with whitespace', () => {
      accepts({'$project': {
        '    fie   ld.nm   ested    ': '$new.field.name'
      }});
    });
    it('$project returns backslashes', () => {
      accepts({'$project': {
        'field\?': '$new.field.name'
      }});
    });
    it('$project accepts cond', () => {
      accepts({
        '$project': {
          title: 1,
          'author.first': 1,
          'author.last': 1,
          'author.middle': {
            '$cond': {
              if: { $eq: [ '', '$author.middle' ] },
              then: '$$REMOVE',
              else: '$author.middle'
            }
          }
        }
      });
    });
    it('$facet returns a pipeline', () => {
      accepts({
        '$facet': {
          'categorizedByTags': [
            {'$unwind': '$tags'},
            {'$sortByCount': '$tags'}
          ],
          'categorizedByPrice': [
            {'$match': {price: {'$exists': 1}}},
            {
              '$bucket': {
                groupBy: '$price',
                boundaries: [0, 150, 200, 300, 400],
                default: 'Other',
                output: {
                  'count': {'$sum': 1},
                  'titles': {'$push': '$title'}
                }
              }
            }
          ],
          'categorizedByYears(Auto)': [
            {
              '$bucketAuto': {
                groupBy: '$year',
                buckets: 4
              }
            }
          ]
        }
      });
    });
  });

  describe('Key syntax', () => {
    describe('field', () => {
      it('returns a field with $ or . later on in quotes', () => {
        accepts({$addFields: {
          't.fiel$d1': 'value1'
        }});
      });
      it('returns a fieldname with space and quotes', () => {
        accepts({$addFields: {
          'fiel d1': 'value1'
        }});
      });
      it('returns a fieldname with escaped characters', () => {
        accepts({$addFields: {
          '\tfiel d\r1': 'value1'
        }});
      });
      it('returns a nested field name', () => {
        accepts({$addFields: {
          'name.name2': 'value1'
        }});
      });
      it('returns an escaped double quote', () => {
        accepts({$addFields: {
          'fiel"d1': 'value1'
        }});
      });
      it('returns an escaped single quote', () => {
        accepts({$addFields: {
          'fiel\'d1': 'value1'
        }});
      });
      it('returns an double quote within single quotes', () => {
        accepts({$addFields: {
          "fiel'd1": 'value1'
        }});
      });
      it('returns an single quote within double quotes', () => {
        accepts({$addFields: {
          'fiel"d1': 'value1'
        }});
      });
      it('returns unicode', () => {
        accepts({$addFields: {
          'fiel☂d1': 'value1'
        }});
      });
    });
    describe('object', () => {
      it('returns an object', () => {
        accepts({$lookup: {
          from: 'fromColl', localField: 'inputField',
          foreignField: 'fromField', as: 'outArray',
          let: { test: 'value' }
        }}
        );
      });
    });
    describe('query_expr', () => {
      it('returns all operators', () => {
        accepts({
          $match: {
            a: {$eq: 1}, b: {$gt: 1}, c: {$gte: 1}, d: {$in: 1}, e: {$lt: 1},
            f2: {$lte: 1}, g: {$ne: 1}, f: {$nin: 1},
            g2: {$and: 1}, h: {$or: 1}, i: {$not: 1}, j: {$nor: 1},
            k: {$exists: 1}, l: {$type: 1},
            m: {$expr: 1}, n: {$jsonSchema: 1}, o: {$mod: 1}, p: {$regex: 1},
            q: {$text: 1}, r: {$where: 1},
            s: {$geoIntersects: 1}, t: {$geoWithin: 1},
            v: {$nearSphere: 1}, u: {$near: 1},
            w: {$all: 1}, x: {$elemMatch: 1}, y: {$size: 1},
            z: {$bitsAllClear: 1}, a1: {$bitsAllSet: 1}, b1: {$bitsAnyClear: 1},
            c1: {$bitsAnySet: 1}, d1: {$comment: 1},
            e1: {$elemMatch: 1}, f1: {$meta: 1}, g1: {$slice: 1}
          }});
      });
      it('returns one op with quotes', () => {
        accepts({ $match: { x: {'$lte': 1} } });
      });
      it('returns non-operator fields', () => {
        accepts({
          $match: {x: 100}});
      });
    });
    describe('agg_expr', () => {
      it('returns all operators without quotes part 1', () => {
        accepts({$addFields: {
          a3: {$abs: 1}, a3: {$cond: 1}, a4: {$gt: 1}, a5: {$gte: 1},
          a6: {$lt: 1}, a7: {$lte: 1}, a8: {$in: 1}, a: {$addToSet: 1},
          q: {$and: 1}, w: {$avg: 1}, e: {$eq: 1}, r: {$first: 1},
          t: {$gte: 1}, y: {$gt: 1}, u: {$lte: 1}, i: {$lt: 1}, o: {$in: 1},
          p: {$last: 1}, a2: {$meta: 1}, s: {$max: 1}, d: {$min: 1},
          f: {$mod: 1}, g: {$ne: 1}, h: {$not: 1}, j: {$or: 1}, j2: {$push: 1},
          k: {$size: 1}, l: {$slice: 1}, z: {$stdDevPop: 1},
          x: {$stdDevSamp: 1}, c: {$sum: 1}, v: {$type: 1}, v2: {$abs: 1},
          b: {$add: 1}, n: {$allElementsTrue: 1}, m: {$anyElementTrue: 1},
          m1: {$arrayElemAt: 1}, 11: {$arrayToObject: 1}, 2: {$ceil: 1},
          3: {$cmp: 1}, 4: {$concatArrays: 1}, 5: {$concat: 1},
          6: {$dateFromParts: 1}, 7: {$dateFromString: 1},
          8: {$dateToString: 1}, 9: {$dateToParts: 1}, 0: {$dayOfMonth: 1}
        }});
      });
      it('returns all operators part 2', () => {
        accepts({$addFields: {
          q: {$dayOfWeek: 1}, w: {$dayOfYear: 1}, e: {$divide: 1},
          r: {$exp: 1}, t: {$filter: 1}, y: {$floor: 1}, u: {$hour: 1},
          i: {$ifNull: 1}, a1: {$isArray: 1}, o: {$indexOfBytes: 1},
          p: {$indexOfArray: 1}, a: {$indexOfCP: 1}, s: {$isoDayOfWeek: 1},
          d: {$isoWeek: 1}, f: {$isoWeekYear: 1}, g: {$let: 1},
          g1: {$literal: 1}, h: {$ln: 1}, j: {$log10: 1}, k: {$log: 1},
          l: {$map: 1}, z: {$mergeObjects: 1}, z1: {$millisecond: 1},
          x: {$minute: 1}, c: {$month: 1}, v: {$multiply: 1},
          b: {$objectToArray: 1}, n: {$pow: 1}, m: {$range: 1},
          m2: {$reduce: 1}, 1: {$reverseArray: 1}, 2: {$second: 1},
          3: {$setDifference: 1}, 4: {$setEquals: 1}, 5: {$setIntersection: 1},
          6: {$setIsSubset: 1}, 7: {$setUnion: 1}, 8: {$split: 1}, 9: {$sqrt: 1},
          0: {$strcasecmp: 1}, 11: {$strLenBytes: 1}, 22: {$strLenCP: 1},
          33: {$substrBytes: 1}, 44: {$substrCP: 1}, 55: {$substr: 1},
          77: {$subtract: 1}, 88: {$switch: 1}, 99: {$toLower: 1},
          aa: {$toUpper: 1}, ss: {$trunc: 1}, dd: {$week: 1}, ff: {$year: 1},
          gg: {$zip: 1}
        }});
      });
      it('returns accumulators', () => {
        accepts({
          $addFields: {
            x: {$sum: 100}
          }});
        accepts({
          $addFields: {
            x: {'$sum': 100}
          }});
        accepts({
          $addFields: {
            x: {'$sum': 100}
          }});
      });
      it('returns non-operator fields', () => {
        accepts({$addFields: {x: 100}});
      });
    });
  });
});

