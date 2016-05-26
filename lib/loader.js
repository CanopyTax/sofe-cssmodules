'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeLoader = require('./nodeLoader.js');

var _nodeLoader2 = _interopRequireDefault(_nodeLoader);

var _browserLoader = require('./browserLoader.js');

var _browserLoader2 = _interopRequireDefault(_browserLoader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof window === 'undefined' ? _nodeLoader2.default : _browserLoader2.default;