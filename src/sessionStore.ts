import * as expressSession from 'express-session';

import { PoolOptions, getPoolConfig } from '@tjsr/mysql-pool-utils';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

const poolOptions: PoolOptions = getPoolConfig();

const sessionStoreOptions: mySQLStore.Options = {
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
  user: poolOptions.user,
};

export let mysqlSessionStore: MySQLStore;
try {
  const MysqlSessionStore = mySQLStore(expressSession);
  mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions /* session store options */
  );
} catch (err) {
  console.error(`Failed getting MySQL session store`, err);
  process.exit(2);
}

