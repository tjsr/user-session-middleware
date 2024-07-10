import * as expressSession from 'express-session';

import { Connection, Pool } from 'mysql2';
import { PoolOptions, elideValues, getPoolConfig } from '@tjsr/mysql-pool-utils';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

import { checkDeletePrivileges } from './store/mysqlStorePermissions.js';

let POOL_OPTIONS: PoolOptions;

const getPoolOptions = (): PoolOptions => {
  if (POOL_OPTIONS === undefined) {
    POOL_OPTIONS = getPoolConfig();
  }
  return POOL_OPTIONS;
};

type USMSessionStoreOptions = mySQLStore.Options & {
  bigNumberStrings: boolean|undefined, supportBigNumbers: boolean | undefined };

let SESSION_STORE_OPTIONS: USMSessionStoreOptions;

const getSessionStoreOptions = (): USMSessionStoreOptions => {
  const poolOptions = getPoolOptions();

  if (SESSION_STORE_OPTIONS === undefined) {
    SESSION_STORE_OPTIONS = {
      ...getPoolOptions(),
      bigNumberStrings: poolOptions.bigNumberStrings,
      createDatabaseTable: true,
      database: poolOptions.database,
      host: poolOptions.host,
      password: poolOptions.password,
      port: poolOptions.port,
      schema: {
        columnNames: {
          data: 'sess',
          expires: 'expire',
          session_id: 'session_id',
        },
        tableName: 'session',
      },
      supportBigNumbers: poolOptions.supportBigNumbers,
      user: poolOptions.user,
    };
  }
  return SESSION_STORE_OPTIONS;
};
  
let mysqlSessionStoreSingleton: MySQLStore;
export const getMysqlSessionStore = (): MySQLStore => {
  const sessionStoreOptions: USMSessionStoreOptions = getSessionStoreOptions();
  if (mysqlSessionStoreSingleton === undefined) {
    try {
      if (process.env['PRINT_SESSION_DB_CONN'] === 'true') {
        console.debug(`Session store options: ${JSON.stringify(sessionStoreOptions, elideValues)}`);
      }
      
      const MysqlSessionStore = mySQLStore(expressSession);
      const mysqlSessionStore: MySQLStore = new MysqlSessionStore(
        sessionStoreOptions /* session store options */
      );
      mysqlSessionStore.validateOptions(sessionStoreOptions);
  const sessionConnection: Connection | Pool = mysqlSessionStore.connection;
      checkDeletePrivileges(sessionConnection).then((complete: boolean) => {
        if (complete) {
          console.log('Successfully checked delete privileges on MySQL session table.');
            mysqlSessionStoreSingleton = mysqlSessionStore;
        } else {
          throw new Error('Failed to complete privilege check on MySQL session table.');
        }
  

      }).catch((err) => {
        console.error('Failed checking delete privileges', err);
        throw err;
      });
    } catch (err) {
      console.error('Failed getting MySQL session store', err);
      throw err;
    }
  }

  return mysqlSessionStoreSingleton;
}
