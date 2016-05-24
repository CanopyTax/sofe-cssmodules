import Plugins from './src/plugins.js';
import Loader from './src/loader.js';

const { fetch, bundle } = new Loader([
  Plugins.values,
  Plugins.localByDefault,
  Plugins.extractImports,
  Plugins.scope
]);

export { Loader, Plugins, fetch, bundle };