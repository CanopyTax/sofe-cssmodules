import test from 'ava';
import jspmLoaderCss from '../index.js';

test('runs ok', (t) =>
  t.not(jspmLoaderCss, null)
);