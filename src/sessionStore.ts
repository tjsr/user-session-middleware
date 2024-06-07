import * as expressSession from 'express-session';

import { Connection, Pool } from 'mysql2';
import { PoolOptions, elideValues, getPoolConfig } from '@tjsr/mysql-pool-utils';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

import { checkDeletePrivileges } from './store/mysqlStorePermissions.js';

const poolOptions: PoolOptions = getPoolConfig();

const sessionStoreOptions: mySQLStore.Options & {
  bigNumberStrings: boolean|undefined, supportBigNumbers: boolean | undefined } = {
    ...poolOptions,
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

  
export let mysqlSessionStore: MySQLStore;
try {
  if (process.env['PRINT_SESSION_DB_CONN'] === 'true') {
    console.debug(`Session store options: ${JSON.stringify(sessionStoreOptions, elideValues)}`);
  }
  
  const MysqlSessionStore = mySQLStore(expressSession);
  mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions /* session store options */
  );
  mysqlSessionStore.validateOptions(sessionStoreOptions);
  const sessionConnection: Connection | Pool = mysqlSessionStore.connection;
  checkDeletePrivileges(sessionConnection).then((complete: boolean) => {
    if (complete) {
      console.log(`Successfully checked delete privileges`);
    }
  }).catch((err) => {
    console.error(`Failed checking delete privileges`, err);
    process.exit(2);
  });
} catch (err) {
  console.error(`Failed getting MySQL session store`, err);
  process.exit(2);
}
