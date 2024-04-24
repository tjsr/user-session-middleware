import * as expressSession from 'express-session';

import mySQLStore, { MySQLStore } from 'express-mysql-session';

import { getPoolConfig } from '@tjsr/mysql-pool-utils';
import mysql from 'mysql';

const poolConfig: mysql.PoolConfig = getPoolConfig();

const sessionStoreOptions: mySQLStore.Options = {
  createDatabaseTable: true,
  database: poolConfig.database,
  host: poolConfig.host,
  password: poolConfig.password,
  port: poolConfig.port,
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
  user: poolConfig.user,
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

