/* eslint-env browser */
import AbstractLoader from './abstractLoader.js';

export default class BrowserLoader extends AbstractLoader {
  constructor(plugins) {
    super(plugins);

    this._useStyleTags = !window.Blob || !window.URL || !URL.createObjectURL || navigator.userAgent.match(/phantomjs/i);
    this._cssContainer = document.createElement('css-container');
    // Wait N seconds before giving up on loading CSS.
    this._maxCssLoadWaitTime = 30;

    document.head.appendChild(this._cssContainer);
  }

  fetch(load, systemFetch) {
    return super.fetch(load, systemFetch)
      .then(this._setBlobUrl.bind(this))
      .then(this._appendStyleSheet.bind(this))
      .then((styleSheet) => styleSheet.exportedTokens);
  }

  _setBlobUrl(styleSheet) {
    if (!this._useStyleTags) {
      const blob = new Blob([styleSheet.injectableSource], { type: 'text/css' });
      styleSheet.blobUrl = URL.createObjectURL(blob);
    }

    return styleSheet;
  }

  _appendStyleSheet(styleSheet) {
    return new Promise((resolve, reject) => {
      if (this._useStyleTags) {
        this._appendStyle(styleSheet);
        resolve(styleSheet);
      } else {
        this._appendLink(styleSheet, resolve, reject);
      }
    });
  }

  _appendStyle(styleSheet) {
    const style = document.createElement('style');
    style.id = styleSheet.name;

    // Not all browsers support style.styleSheet. Support fallback.
    if (style.styleSheet) {
      style.styleSheet.cssText = styleSheet.injectableSource;
    } else {
      style.appendChild(document.createTextNode(styleSheet.injectableSource));
    }

    this._cssContainer.appendChild(style);
  }

  _appendLink(styleSheet, resolve, reject) {

    const existing = document.getElementById(styleSheet.name); 
    if (existing) {
      existing.href = styleSheet.blobUrl;
      resolve(styleSheet);
      return;
    }

    const link = document.createElement('link');
    link.id = styleSheet.name;
    link.rel = 'stylesheet';
    link.href = styleSheet.blobUrl;

    // It's important to wait for CSS to be parsed by browser before resolving promise.
    // Otherwise, FOUC will occur as CSS module has been returned, but not fully loaded by browser.
    const cssLoadWaitTimeout = setTimeout(() => {
      reject(`Unable to load styleSheet ${styleSheet.name}`);
    }, this._maxCssLoadWaitTime * 1000);

    const onLinkLoadComplete = () => {
      clearTimeout(cssLoadWaitTimeout);
      link.onload = link.onerror = () => {};
    };

    link.onload = () => {
      onLinkLoadComplete();
      resolve(styleSheet);
    };

    link.onerror = (event) => {
      onLinkLoadComplete();
      reject(event.error || new Error(`Error loading styleSheet ${styleSheet.name}`));
    };

    this._cssContainer.appendChild(link);
  }
}
