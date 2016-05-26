'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-env node, browser */

var CSSModuleLoaderProcess = function () {
  function CSSModuleLoaderProcess() {
    _classCallCheck(this, CSSModuleLoaderProcess);

    // enforce this on exported functions
    this.fetch = this.fetch.bind(this);
  }

  _createClass(CSSModuleLoaderProcess, [{
    key: 'fetch',
    value: function fetch(load, systemFetch, processSofe) {
      var _this = this;

      var sourcePath = load.address.replace(System.baseURL, '');
      var originalSource = void 0;

      return systemFetch(load).then(function (source) {
        originalSource = source;

        if (source.indexOf('function(') > -1) {
          // is JS module
          return source;
        }

        return new Promise(function (resolve, reject) {
          System.import('css-modules-loader-core').then(function (CssModulesLoaderCore) {
            _this._cssModulesLoader = new CssModulesLoaderCore([CssModulesLoaderCore.values, CssModulesLoaderCore.localByDefault, CssModulesLoaderCore.extractImports, CssModulesLoaderCore.scope]);
            return _this._cssModulesLoader.load(source, sourcePath, '', _this._fetchDependencies.bind(_this));
          });
        });
      }).then(function (args) {
        if (typeof args === 'string') return args;

        var exportedTokens = void 0;
        var result = void 0;

        var injectableSource = args.injectableSource;
        var exportTokens = args.exportTokens;


        if (processSofe) {
          result = processSofe(originalSource, exportTokens);
          exportTokens = result.tokens;
        }

        var exportTokensString = JSON.stringify(exportTokens).replace(/"/g, '\\"');
        if (!System.production && typeof window !== 'undefined' && window.Proxy) {
          // During development, if supported, use a Proxy to detect missing CSS declarations.
          // Note the wrapping `'s - this is code exported as a string and executed later.
          exportedTokens = '\n            const styles = JSON.parse(\'' + exportTokensString + '\');\n            const propertyWhitelist = [\'__esModule\', \'then\', \'default\', \'trim\'];\n            const proxy = new Proxy(styles, {\n              get: function(target, name) {\n                if(!target.hasOwnProperty(name) && !propertyWhitelist.includes(name)) {\n                  console.warn(\'Styles lookup at key: \' + name + \' found no CSS.\');\n                }\n\n                return target[name];\n              }\n            });\n\n            module.exports = proxy;\n        ';
        } else {
          exportedTokens = _this.getSofeDependencies(result.services) + 'module.exports = JSON.parse(\'' + exportTokensString + '\');';
        }

        return {
          name: sourcePath,
          exportedTokens: exportedTokens,
          injectableSource: injectableSource
        };
      }).catch(function (err) {
        throw new Error(err);
      });
    }
  }, {
    key: 'getSofeDependencies',
    value: function getSofeDependencies() {
      var services = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return services.reduce(function (requireStatements, service) {
        return requireStatements + '\n' + ('require(\'' + service + '.css!sofe\');');
      }, '');
    }

    // Figure out the path that System will need to find the right file,
    // and trigger the import (which will instantiate this loader once more)

  }, {
    key: '_fetchDependencies',
    value: function _fetchDependencies(rawDependencyPath, relativeToPath) {
      var formattedDependencyPath = this._removeWrappingQuotes(rawDependencyPath);
      var canonicalParent = relativeToPath.replace(/^\//, '');

      return System.normalize(formattedDependencyPath, '' + System.baseURL + canonicalParent).then(System.import.bind(System)).then(function (exportedTokens) {
        return exportedTokens.default || exportedTokens;
      }).catch(function (err) {
        throw err;
      });
    }
  }, {
    key: '_removeWrappingQuotes',
    value: function _removeWrappingQuotes(string) {
      return string.replace(/^["']|["']$/g, '');
    }
  }]);

  return CSSModuleLoaderProcess;
}();

exports.default = CSSModuleLoaderProcess;