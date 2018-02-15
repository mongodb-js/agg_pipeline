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
  describe('Valid stage', () => {
    it('should accept a simple stage', () => {
      accepts('{"$match": {x: 1}}');
    });
    it('should accept a constant', () => {
      accepts('{"$limit": 1}');
    });
  });

  describe('Invalid stage', () => {
    it('should not accept an empty stage', () => {
      rejects('{}');
    });
  });
});

