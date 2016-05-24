import NodeLoader from './nodeLoader.js';
import BrowserLoader from './browserLoader.js';

export default typeof window === 'undefined' ? NodeLoader : BrowserLoader;