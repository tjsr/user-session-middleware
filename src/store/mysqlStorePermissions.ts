import { Connection, FieldPacket, Pool, QueryError, QueryResult } from 'mysql2';

import { SessionDatabaseTableAccessDenied } from '../errors/database/databaseErrors.js';

// type MysqlCallbackHandlerParams = (err: QueryError | null, result: QueryResult, fields: FieldPacket[]) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (err: any, reject: (_reason?: any) => void) => {
  if (err.code === 'ER_TABLEACCESS_DENIED_ERROR' || err.errno === 1142) {
    const dbError = new SessionDatabaseTableAccessDenied(err);
    return reject(dbError);
  } else {
    return reject(err);
  }
};

const completeOrError = (
  resolve: (_value: boolean) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (_reason?: any) => void,
  err: QueryError | null): void => {
  if (err) {
    return handleError(err, reject);
  } else {
    return resolve(true);
  }
};

export const checkDeletePrivileges = async (conn: Connection | Pool): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      conn.query(`DELETE FROM session WHERE session_id = 'privileges-check'`, {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: QueryError | null, _result: QueryResult, _fields: FieldPacket[]): any => {
          return completeOrError(resolve, reject, err);
        });
    } catch (err) {
      console.error(`Failed checking delete privileges`, err);
      reject(err);
    }
  });
};
