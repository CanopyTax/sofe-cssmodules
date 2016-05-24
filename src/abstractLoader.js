/* eslint-env node, browser */
import CssModulesLoaderCore from 'css-modules-loader-core';

export default class CSSModuleLoaderProcess {
  constructor(plugins) {
    this._cssModulesLoader = new CssModulesLoaderCore(plugins);

    // enforce this on exported functions
    this.fetch = this.fetch.bind(this);
  }

  fetch(load, systemFetch) {
    const sourcePath = load.address.replace(System.baseURL, '');

    return systemFetch(load)
      .then((source) =>
        this._cssModulesLoader.load(source, sourcePath, '', this._fetchDependencies.bind(this))
      )
      .then(({ injectableSource, exportTokens }) => {
        let exportedTokens;
        const exportTokensString = JSON.stringify(exportTokens).replace(/"/g, '\\"');
        if (!System.production && typeof window !== 'undefined' && window.Proxy) {
          // During development, if supported, use a Proxy to detect missing CSS declarations.
          // Note the wrapping `'s - this is code exported as a string and executed later.
          exportedTokens = `
            const styles = JSON.parse('${exportTokensString}');
            const propertyWhitelist = ['__esModule', 'then', 'default', 'trim'];
            const proxy = new Proxy(styles, {
              get: function(target, name) {
                if(!target.hasOwnProperty(name) && !propertyWhitelist.includes(name)) {
                  console.warn('Styles lookup at key: ' + name + ' found no CSS.');
                }
              
                return target[name];
              }
            });
          
            module.exports = proxy;
        `;
        } else {
          exportedTokens = `module.exports = JSON.parse('${exportTokensString}');`;
        }

        return {
          name: sourcePath,
          exportedTokens,
          injectableSource
        };
      });
  }

  // Figure out the path that System will need to find the right file,
  // and trigger the import (which will instantiate this loader once more)
  _fetchDependencies(rawDependencyPath, relativeToPath) {
    const formattedDependencyPath = this._removeWrappingQuotes(rawDependencyPath);
    const canonicalParent = relativeToPath.replace(/^\//, '');

    return System.normalize(formattedDependencyPath, `${System.baseURL}${canonicalParent}`)
      .then(System.import.bind(System))
      .then((exportedTokens) => exportedTokens.default || exportedTokens);
  }

  _removeWrappingQuotes(string) {
    return string.replace(/^["']|["']$/g, '');
  }
}
