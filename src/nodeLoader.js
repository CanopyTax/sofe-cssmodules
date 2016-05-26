/* eslint-env node */
import AbstractLoader from './abstractLoader.js';
import cssnano from 'cssnano';
import css from 'css';

// Append a <style> tag to the page and fill it with inline CSS styles.
const cssInjectFunction = `(function(c){
  var d=document,a="appendChild",i="styleSheet",s=d.createElement("style");
  d.head[a](s);
  s[i]?s[i].cssText=c:s[a](d.createTextNode(c));
})`;

// Escape any whitespace characters before outputting as string so that data integrity can be preserved.
const escape = (source) => {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, '\\f')
    .replace(/[\b]/g, '\\b')
    .replace(/[\n]/g, '\\n')
    .replace(/[\t]/g, '\\t')
    .replace(/[\r]/g, '\\r')
    .replace(/[\']/g, '\\\'')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');
};

export default class NodeLoader extends AbstractLoader {
  constructor(plugins) {
    super(plugins);

    this._injectableSources = [];

    this.fetch = this.fetch.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  fetch(load, systemFetch) {
    return super.fetch(load, systemFetch, this.processSofe.bind(this))
      .then((styleSheet) => {
        this._injectableSources.push(styleSheet.injectableSource);
        return styleSheet;
      })
      // Return the export tokens to the js files
			.then((styleSheet) => styleSheet.exportedTokens)
			.catch((err) => { throw err; });
  }

	processSofe(source, tokens) {
		const ast = css.parse(source);
		let services = [];

		const newTokens = ast.stylesheet.rules
			.filter(outNonComposeRules)
			.reduce(toNewTokensObject, tokens);

		return {
			tokens: newTokens, services
		};

		function outNonComposeRules(rule) {
			// At least one declaration in the rule is 'composes' and is sofe
			return rule.declarations.filter(dec => {
				return dec.property === 'composes' && dec.value.indexOf('!sofe') > -1;
			}).length;
		}

		function toNewTokensObject(tokens, rule) {
			return {
				...tokens,
				[rule.selectors[0].substring(1)]: tokens[rule.selectors[0].substring(1)] + getServiceClassNames(rule)
			};
		}

		function getServiceClassNames(rule) {
			return rule.declarations.reduce((className, dec) => {
				if (dec.property === 'composes' && dec.value.indexOf('!sofe') > -1) {
					let groups = (/(.+)\W*from\W*('|")(.+)!sofe('|")/g).exec(dec.value);
					let service = groups[3];
					let importedClass = groups[1].trim();

					if (service.indexOf('.') > -1) {
						service = service.substring(0, service.indexOf('.'));
					}

					if (services.indexOf(service) === -1) {
						services = [...services, service];
					}

					return ` _sofe_${service}__${importedClass}`;
				} else {
					return className;
				}
			}, ' ');
		}
	}

  bundle(loads, compileOpts, outputOpts) {
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

    return cssnano.process(this._injectableSources.join('\n'), {
      // A full list of options can be found here: http://cssnano.co/options/
      // safe: true ensures no optimizations are applied which could potentially break the output.
      safe: true
    }).then((result) => {
      return `${cssInjectFunction}('${escape(result.css)}');`;
		}).catch((err) => { throw err });
  }

}
