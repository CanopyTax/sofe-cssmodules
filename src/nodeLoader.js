/* eslint-env node */
import AbstractLoader from './abstractLoader.js';
import cssnano from 'cssnano';

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

const emptySystemRegister = (system, name) => {
  return `${system}.register('${name}', [], function() { return { setters: [], execute: function() {}}});`;
};

export default class NodeLoader extends AbstractLoader {
  constructor(plugins) {
    super(plugins);

    this._injectableSources = [];

    this.fetch = this.fetch.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  fetch(load, systemFetch) {
    return super.fetch(load, systemFetch)
      .then((styleSheet) => {
        this._injectableSources.push(styleSheet.injectableSource);
        return styleSheet;
      })
      // Return the export tokens to the js files
      .then((styleSheet) => styleSheet.exportedTokens);
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
      // Take all of the CSS files which need to be output and generate a fake System registration for them.
      // This will make System believe all files exist as needed.
      // Then, take the combined output of all the CSS files and generate a single <style> tag holding all the info.
      const fileDefinitions = loads
        .map((load) => emptySystemRegister(compileOpts.systemGlobal || 'System', load.name))
        .join('\n');

      return `${fileDefinitions}${cssInjectFunction}('${escape(result.css)}');`;
    });
  }
}