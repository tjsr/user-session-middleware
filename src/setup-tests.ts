const { info, log, warn, error } = console;

import { loadEnv, setTestMode } from '@tjsr/simple-env-utils';

let ignored: (string|RegExp)[] = ['You are running Vue in development mode.', 'Found no env files to load.'];

let ignoredSourceMethods: string[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterIgnored = (callback:Function, ...args:any[]) => {
  const firstArg = args?.[0];
  let msg;
  if (typeof firstArg === 'function') {
    if (ignoredSourceMethods.includes(firstArg.name)) {
      return;
    }
    msg = args?.[1];
  } else {
    msg = args?.[0];
  }

  if (typeof msg === 'function' && ignoredSourceMethods.includes(args[0].name)) {
    return;
  }
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

export const addIgnoredLog = (msg: string|RegExp): void => {
  ignored.push(msg);
};

export const addIgnoredLogsFromFunction = (...fns: Function[]): void => {
  fns.forEach((fn) => {
    ignoredSourceMethods.push(fn.name);
  });
};

export const removeIgnoredLogsFromFunction = (fn: Function): void => {
  ignoredSourceMethods = ignoredSourceMethods.filter((ignoredFn) => ignoredFn !== fn.name);
};

export const clearIgnoredFunctions = () => {
  ignoredSourceMethods = [];
};

export const clearIgnoreLogFilters = () => {
  ignored = [];
};

loadEnv({ silent: true });

setTestMode();
