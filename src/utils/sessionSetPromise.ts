import { SessionData, Store } from '../express-session/index.ts';

export const storeSetAsPromise = async (store: Store, sid: string, data: SessionData): Promise<void> => {
  if (!process.env['VITEST']) {
    throw new Error('Should only be called when run under vitest - not for runtime use');
  }
  return new Promise((resolve, reject) => {
    store.set(sid, data, (err) => {
      console.debug('TESTING', storeSetAsPromise, `Stored ${sid} in store with data ${JSON.stringify(data)}`);
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};
