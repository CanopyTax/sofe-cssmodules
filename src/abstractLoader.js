/* eslint-env node, browser */

export default class CSSModuleLoaderProcess {
  constructor() {

    // enforce this on exported functions
    this.fetch = this.fetch.bind(this);
  }

  fetch(load, systemFetch, processSofe) {
    const sourcePath = load.address.replace(System.baseURL, '');
		let originalSource;

    return systemFetch(load)
      .then((source) => {
				originalSource = source;

				if (source.indexOf('function(') > -1) {
					// is JS module
					return source;
				}

				return new Promise((resolve, reject) => {
					System.import('css-modules-loader-core')
						.then((CssModulesLoaderCore) => {
							this._cssModulesLoader = new CssModulesLoaderCore([
								CssModulesLoaderCore.values,
								CssModulesLoaderCore.localByDefault,
								CssModulesLoaderCore.extractImports,
								CssModulesLoaderCore.scope,
							]);
							resolve(this._cssModulesLoader.load(source, sourcePath, '', this._fetchDependencies.bind(this)));
						})
						.catch(reject);
				});
			})
      .then((args) => {
				if (typeof args === 'string') return args;

				let exportedTokens;
				let result;

				let { injectableSource, exportTokens } = args;

				if (processSofe) {
					result = processSofe(originalSource, exportTokens);
					exportTokens = result.tokens;
				}

        const exportTokensString = JSON.stringify(exportTokens).replace(/"/g, '\\"');
        if (!System.production && typeof window !== 'undefined' && window.Proxy) {
          // During development, if supported, use a Proxy to detect missing CSS declarations.
          // Note the wrapping `'s - this is code exported as a string and executed later.
          exportedTokens = `
						${this.getSofeDependencies(result ? result.services : [])}
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
          exportedTokens = `${this.getSofeDependencies(result.services)}module.exports = JSON.parse('${exportTokensString}');`;
        }

        return {
          name: sourcePath,
          exportedTokens,
          injectableSource
        };
			})
			.catch((err) => {throw new Error(err)});
  }

	getSofeDependencies(services = []) {
		return services.reduce((requireStatements, service) => {
			return requireStatements + '\n' + `require('${service}.css!sofe');`;
		}, '');
	}


  // Figure out the path that System will need to find the right file,
  // and trigger the import (which will instantiate this loader once more)
  _fetchDependencies(rawDependencyPath, relativeToPath) {
    const formattedDependencyPath = this._removeWrappingQuotes(rawDependencyPath);
    const canonicalParent = relativeToPath.replace(/^\//, '');

    return System.normalize(formattedDependencyPath, `${System.baseURL}${canonicalParent}`)
      .then(System.import.bind(System))
			.then((exportedTokens) => exportedTokens.default || exportedTokens)
			.catch((err) => {throw err});
  }

  _removeWrappingQuotes(string) {
    return string.replace(/^["']|["']$/g, '');
  }
}
