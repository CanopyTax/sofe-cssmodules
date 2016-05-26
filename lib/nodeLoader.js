'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _abstractLoader = require('./abstractLoader.js');

var _abstractLoader2 = _interopRequireDefault(_abstractLoader);

var _cssnano = require('cssnano');

var _cssnano2 = _interopRequireDefault(_cssnano);

var _css = require('css');

var _css2 = _interopRequireDefault(_css);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node */


// Append a <style> tag to the page and fill it with inline CSS styles.
var cssInjectFunction = '(function(c){\n  var d=document,a="appendChild",i="styleSheet",s=d.createElement("style");\n  d.head[a](s);\n  s[i]?s[i].cssText=c:s[a](d.createTextNode(c));\n})';

// Escape any whitespace characters before outputting as string so that data integrity can be preserved.
var escape = function escape(source) {
  return source.replace(/(["\\])/g, '\\$1').replace(/[\f]/g, '\\f').replace(/[\b]/g, '\\b').replace(/[\n]/g, '\\n').replace(/[\t]/g, '\\t').replace(/[\r]/g, '\\r').replace(/[\']/g, '\\\'').replace(/[\u2028]/g, '\\u2028').replace(/[\u2029]/g, '\\u2029');
};

var NodeLoader = function (_AbstractLoader) {
  _inherits(NodeLoader, _AbstractLoader);

  function NodeLoader(plugins) {
    _classCallCheck(this, NodeLoader);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NodeLoader).call(this, plugins));

    _this._injectableSources = [];

    _this.fetch = _this.fetch.bind(_this);
    _this.bundle = _this.bundle.bind(_this);
    return _this;
  }

  _createClass(NodeLoader, [{
    key: 'fetch',
    value: function fetch(load, systemFetch) {
      var _this2 = this;

      return _get(Object.getPrototypeOf(NodeLoader.prototype), 'fetch', this).call(this, load, systemFetch, this.processSofe.bind(this)).then(function (styleSheet) {
        _this2._injectableSources.push(styleSheet.injectableSource);
        return styleSheet;
      })
      // Return the export tokens to the js files
      .then(function (styleSheet) {
        return styleSheet.exportedTokens;
      }).catch(function (err) {
        throw err;
      });
    }
  }, {
    key: 'processSofe',
    value: function processSofe(source, tokens) {
      var ast = _css2.default.parse(source);
      var services = [];

      var newTokens = ast.stylesheet.rules.filter(outNonComposeRules).reduce(toNewTokensObject, tokens);

      return {
        tokens: newTokens, services: services
      };

      function outNonComposeRules(rule) {
        // At least one declaration in the rule is 'composes' and is sofe
        return rule.declarations.filter(function (dec) {
          return dec.property === 'composes' && dec.value.indexOf('!sofe') > -1;
        }).length;
      }

      function toNewTokensObject(tokens, rule) {
        return _extends({}, tokens, _defineProperty({}, rule.selectors[0].substring(1), tokens[rule.selectors[0].substring(1)] + getServiceClassNames(rule)));
      }

      function getServiceClassNames(rule) {
        return rule.declarations.reduce(function (className, dec) {
          if (dec.property === 'composes' && dec.value.indexOf('!sofe') > -1) {
            var groups = /(.+)\W*from\W*('|")(.+)!sofe('|")/g.exec(dec.value);
            var service = groups[3];
            var importedClass = groups[1].trim();

            if (service.indexOf('.') > -1) {
              service = service.substring(0, service.indexOf('.'));
            }

            if (services.indexOf(service) === -1) {
              services.push(service);
            }

            return ' _sofe_' + service + '__' + importedClass;
          } else {
            return className;
          }
        }, ' ');
      }
    }
  }, {
    key: 'bundle',
    value: function bundle(loads, compileOpts, outputOpts) {
      /*eslint-disable no-console */
      if (outputOpts.buildCSS === false) {
        console.warn('Opting out of buildCSS not yet supported.');
      }

      if (outputOpts.separateCSS === true) {
        console.warn('Separting CSS not yet supported.');
      }

      if (outputOpts.sourceMaps === true) {
        console.warn('Source Maps not yet supported');
      }
      /*eslint-enable  no-console */

      return _cssnano2.default.process(this._injectableSources.join('\n'), {
        // A full list of options can be found here: http://cssnano.co/options/
        // safe: true ensures no optimizations are applied which could potentially break the output.
        safe: true
      }).then(function (result) {
        return cssInjectFunction + '(\'' + escape(result.css) + '\');';
      }).catch(function (err) {
        throw err;
      });
    }
  }]);

  return NodeLoader;
}(_abstractLoader2.default);

exports.default = NodeLoader;