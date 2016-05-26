'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bundle = exports.fetch = exports.Loader = undefined;

var _loader = require('./src/loader.js');

var _loader2 = _interopRequireDefault(_loader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ref = new _loader2.default();

var fetch = _ref.fetch;
var bundle = _ref.bundle;
exports.Loader = _loader2.default;
exports.fetch = fetch;
exports.bundle = bundle;