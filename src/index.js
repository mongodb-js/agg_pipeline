/* eslint-disable no-lonely-if, complexity */
const parser = require('../lib/parser.js');

const cleanWhiteSpace = function(s) {
  let ret = '';
  let inDString = false;
  let inSString = false;
  for (let i = 0, len = s.length; i < len; i++) {
    const ch = s.charAt(i);
    if (ch === '\\') {
      ret += ch;
      i++;
      ret += s.charAt(i);
      continue;
    }
    if (inDString) {
      if (ch === '"') {
        inDString = false;
      }
      ret += ch;
    } else if (inSString) {
      if (ch === '\'') {
        inSString = false;
      }
      ret += ch;
    } else {
      if (ch === '"') {
        inDString = true;
        ret += ch;
      } else if (ch === '\'') {
        inSString = true;
        ret += ch;
      } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        continue;
      } else {
        ret += ch;
      }
    }
  }
  return ret;
};

module.exports = {
  parse: function(input) {
    return parser.parse(cleanWhiteSpace(input));
  },
  accepts: function(input) {
    try {
      parser.parse(cleanWhiteSpace(input));
      return true;
    } catch (e) {
      return false;
    }
  }
};


