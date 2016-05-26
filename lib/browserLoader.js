'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _abstractLoader = require('./abstractLoader.js');

var _abstractLoader2 = _interopRequireDefault(_abstractLoader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env browser */


var BrowserLoader = function (_AbstractLoader) {
  _inherits(BrowserLoader, _AbstractLoader);

  function BrowserLoader() {
    _classCallCheck(this, BrowserLoader);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BrowserLoader).call(this));

    _this._useStyleTags = !window.Blob || !window.URL || !URL.createObjectURL || navigator.userAgent.match(/phantomjs/i);
    _this._cssContainer = document.createElement('css-container');
    // Wait N seconds before giving up on loading CSS.
    _this._maxCssLoadWaitTime = 30;

    document.head.appendChild(_this._cssContainer);
    return _this;
  }

  _createClass(BrowserLoader, [{
    key: 'fetch',
    value: function fetch(load, systemFetch) {
      return _get(Object.getPrototypeOf(BrowserLoader.prototype), 'fetch', this).call(this, load, systemFetch).then(this._setBlobUrl.bind(this)).then(this._appendStyleSheet.bind(this)).then(function (styleSheet) {
        return typeof styleSheet === 'string' ? styleSheet : styleSheet.exportedTokens;
      });
    }
  }, {
    key: '_setBlobUrl',
    value: function _setBlobUrl(styleSheet) {
      if (!this._useStyleTags && typeof styleSheet !== 'string') {
        var blob = new Blob([styleSheet.injectableSource], { type: 'text/css' });
        styleSheet.blobUrl = URL.createObjectURL(blob);
      }

      return styleSheet;
    }
  }, {
    key: '_appendStyleSheet',
    value: function _appendStyleSheet(styleSheet) {
      var _this2 = this;

      if (typeof styleSheet === 'string') return styleSheet;

      return new Promise(function (resolve, reject) {
        if (_this2._useStyleTags) {
          _this2._appendStyle(styleSheet);
          resolve(styleSheet);
        } else {
          _this2._appendLink(styleSheet, resolve, reject);
        }
      });
    }
  }, {
    key: '_appendStyle',
    value: function _appendStyle(styleSheet) {
      var style = document.createElement('style');
      style.id = styleSheet.name;

      // Not all browsers support style.styleSheet. Support fallback.
      if (style.styleSheet) {
        style.styleSheet.cssText = styleSheet.injectableSource;
      } else {
        style.appendChild(document.createTextNode(styleSheet.injectableSource));
      }

      this._cssContainer.appendChild(style);
    }
  }, {
    key: '_appendLink',
    value: function _appendLink(styleSheet, resolve, reject) {
      var existing = document.getElementById(styleSheet.name);
      if (existing) {
        existing.href = styleSheet.blobUrl;
        resolve(styleSheet);
        return;
      }

      var link = document.createElement('link');
      link.id = styleSheet.name;
      link.rel = 'stylesheet';
      link.href = styleSheet.blobUrl;

      // It's important to wait for CSS to be parsed by browser before resolving promise.
      // Otherwise, FOUC will occur as CSS module has been returned, but not fully loaded by browser.
      var cssLoadWaitTimeout = setTimeout(function () {
        reject('Unable to load styleSheet ' + styleSheet.name);
      }, this._maxCssLoadWaitTime * 1000);

      var onLinkLoadComplete = function onLinkLoadComplete() {
        clearTimeout(cssLoadWaitTimeout);
        link.onload = link.onerror = function () {};
      };

      link.onload = function () {
        onLinkLoadComplete();
        resolve(styleSheet);
      };

      link.onerror = function (event) {
        onLinkLoadComplete();
        reject(event.error || new Error('Error loading styleSheet ' + styleSheet.name));
      };

      this._cssContainer.appendChild(link);
    }
  }]);

  return BrowserLoader;
}(_abstractLoader2.default);

exports.default = BrowserLoader;