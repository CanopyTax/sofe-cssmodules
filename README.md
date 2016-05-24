# JSPM Loader: CSS

[![Join the chat at https://gitter.im/geelen/jspm-loader-css](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/geelen/jspm-loader-css?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Description

This is a CSS loader for jspm. It uses PostCSS plugins to parse your CSS files. By default, it only applies the CSS Modules plugin suite to your CSS, but it can be extended to suit your needs.
This loader has been built for jspm >0.17. You may experience difficulties, or it may not work at all, if you are using jspm v0.16.

> That's pretty cool, but what the heck is CSS Modules?

Here's some reading material:

- https://github.com/css-modules/css-modules
- http://glenmaddern.com/articles/css-modules
- https://github.com/css-modules/css-modules-loader-core

Essentially, CSS Modules automatically namespaces all of your classes to guarantee uniqueness. It returns to you an object of key/value pairs (in JavaScript) which you use to apply the generated class names to your elements.

## Installation

To installl, run the following command:

```
jspm install github:MeoMix/jspm-loader-css@master"
```

and in `jspm.config.js` you'll need to add the following:

```
SystemJS.config({
  ...
  meta: {
    "*.css": {
      "loader": "jspm-loader-css"
    }
  },
  ...
});
```

Load the styles by referencing them in your JS:

```js
import styles from './foo.css'
elem.innerHTML = `<div class="${styles.fooComponent}"></div>`
```


## Loading additional PostCSS plugins

It's likely that you will want to load additional, non-default PostCSS plugins for additional processing of your CSS. That is a supported scenario with this plugin, but requires minor adjustments to `jspm.config.js`

You should re-write your meta configuration such that it looks similar to:

```
SystemJS.config({
  ...
  meta: {
    "*.css": {
      "loader": "css.js"
    }
  },
  ...
});
```

where `css.js` is a file you create yourself. You can place `css.js` in a directory if you'd like, but you'll need to provide the full path to it inside `jspm.config.js`.

You'll need to import `jspm-loader-css` from within `css.js` like so:

```
import Plugins from 'jspm-loader-css/src/plugins.js'
import Loader from 'jspm-loader-css/src/loader.js'

const plugins = [
  Plugins.values,
  Plugins.localByDefault,
  Plugins.extractImports,
  Plugins.scope
];

const { fetch, bundle } = new Loader(plugins);
export { fetch, bundle };
```

The above code will perform identically to the default behavior of `jspm-loader-css`. You are then free to add additional plugins to the mixture, such as:

```
import Plugins from 'jspm-loader-css/src/plugins.js'
import Loader from 'jspm-loader-css/src/loader.js'
import autoprefixer from 'autoprefixer';

const plugins = [
  Plugins.values,
  Plugins.localByDefault,
  Plugins.extractImports,
  Plugins.scope,
  autoprefixer()
];

const { fetch, bundle } = new Loader(plugins);
export { fetch, bundle };
```

Keep in mind that `jspm-loader-css` runs both in the browser (during development) and in node (during production builds). Many PostCSS plugins are written with only node in mind. Your mileage may vary on being able to successfully use PostCSS plugins without modification.

For a working example of `jspm-loader-css` in `css.js`, see here: https://github.com/MeoMix/StreamusWebsite/blob/development/jspm/css.js

## Misc. Notes

I'm going to say this once and only once. **THERE IS NO GUARANTEE ON LOAD ORDER OF YOUR CSS**. Do not write CSS which only works because it comes after another CSS file. You will be very sad.

> ...but how do I load something like normalize.css?

You should load it via a separate `<link>` tag which points to its CDN.

> ...but I REALLY, REALLY, REALLY need one of my CSS files to come after another

Consider using [PostCSS-Import](https://github.com/postcss/postcss-import) to prepend one file above the other. Note that you should not do this for N files as you'll drastically increase the size of your CSS output. You'll need to provide custom `load` and `resolve` methods as options. See the example `css.js` file above for more information.

> ..do I have other options?

You can also use additional, explicit `<link>` tags and, as part of your build process, inline and minify as needed.

> It sucks that I can't use `composes` from within pseudo-selectors and/or media queries

Agreed. Consider using:

- https://github.com/MeoMix/postcss-inline-trait
- https://github.com/MeoMix/postcss-mixin-from
