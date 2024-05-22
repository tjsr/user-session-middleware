const { info, log, warn, error } = console;

import { loadEnv } from '@tjsr/simple-env-utils';

const ignored: (string|RegExp)[] = ['You are running Vue in development mode.', 'Found no env files to load.'];

const filterIgnored = (callback, ...args) => {
  const msg = args?.[0];
  if (typeof msg !== 'string' || !ignored.some((ignoredMsg) => {
    if (typeof ignoredMsg === 'string' && msg.includes(ignoredMsg)) {
      return true;
    } else if (ignoredMsg instanceof RegExp && ignoredMsg.test(msg)) {
      return true;
    }
    return false;
  })) {
    callback(...args);
  }
};

console.info = (...args) => filterIgnored(info, ...args);
console.log = (...args) => filterIgnored(log, ...args);
console.warn = (...args) => filterIgnored(warn, ...args);
console.error = (...args) => filterIgnored(error, ...args);
console.debug = (...args) => filterIgnored(error, ...args);

export const addIgnoredLog = (msg: string) => {
  ignored.push(msg);
};

loadEnv({ silent: true });
