import * as expressSession from 'express-session';

import { SystemHttpRequestType, SystemSessionDataType, uuid4 } from './types.js';

import { IncomingHttpHeaders } from 'http';
import { loadEnv } from '@tjsr/simple-env-utils';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new session.MemoryStore();

loadEnv();
const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;

export const getSession = <DataType extends SystemSessionDataType,
  RequestType extends SystemHttpRequestType<DataType>>(useSessionStore: expressSession.Store = memoryStore) => {
  return session({
    cookie: {
      maxAge: IN_PROD ? TWO_HOURS : TWENTYFOUR_HOURS,
      path: '/',
      sameSite: true,
      secure: IN_PROD,
    },
    genid: function (req: RequestType) {
      const headers: IncomingHttpHeaders = req.headers;
      const sessionIdHeader: string | string[] | undefined =
        headers['x-session-id'];
      if (
        typeof sessionIdHeader === 'string' &&
        sessionIdHeader !== 'undefined'
      ) {
        req.newSessionIdGenerated = false;
        return sessionIdHeader;
      }
      if (req.session?.id) {
        req.newSessionIdGenerated = false;
        return req.session.id;
      }
      const cookieValue = req.cookies?.sessionId;
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        req.newSessionIdGenerated = false;
        return cookieValue;
      }
      const newId: uuid4 = uuidv4(); // use UUIDs for session IDs
      req.newSessionIdGenerated = true;
      return newId;
    },
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env['SESSION_SECRET'] || uuidv4(),
    store: useSessionStore !== undefined ? useSessionStore : memoryStore,
  });
};
