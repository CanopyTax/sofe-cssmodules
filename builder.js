/*eslint-inv node*/
var path = require('path');
var postcss = require('postcss');
var fs = require('fs');
var chalk = require('chalk');
var cssnano = require('cssnano');

var argv = require('minimist')(process.argv.slice(2));

if (argv._.length !== 2 || argv.h || !argv.s) {
	console.log(chalk.blue('               SOFE CSS Modules Builder v' + require('./package.json').version));
	console.log('---------------------------------------------------------------');
	console.log(chalk.green('sofe-css-builder ') + chalk.yellow('-s=[serviceName] ') + chalk.yellow('[input.css] [built-output.js]'));
	process.exit(1);
}

var inputFile = path.join(process.cwd(), argv._[0]);
var outputFile = path.join(process.cwd(), argv._[1]);

var css = fs.readFileSync(inputFile, 'utf8');
var json;

console.log(chalk.blue('Building ') + inputFile);

postcss([
  require('postcss-modules')({
		scopeBehaviour: 'local',
    generateScopedName: function(name, filename, css) {
      return '_sofe_' + argv.s + '__' + name;
		},
		getJSON: function(cssFileName, _json) {
			json = _json;
		}
  })
]).process(css, { from: inputFile }).then(function(result) {

	cssnano.process(result.css, { safe: true })
		.then((result) => {
			var output = `
(function(c){
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = c;
	document.head.insertBefore(style, document.head.firstChild);
})("${removeWrappingQuotes(result.css)}");

module.exports = ${JSON.stringify(json)};
			`;

			fs.writeFileSync(outputFile, output);
			console.log(chalk.green('CSS built to', outputFile));
		})
		.catch(err => {
			console.log(chalk.red('Error:\t') + err)
			process.exit(1);
		});
});

function removeWrappingQuotes(source) {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, '\\f')
    .replace(/[\b]/g, '\\b')
    .replace(/[\n]/g, '\\n')
    .replace(/[\t]/g, '\\t')
    .replace(/[\r]/g, '\\r')
    .replace(/[\']/g, '\\\'')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029')
		.replace(/^["']|["']$/g, '');
}
