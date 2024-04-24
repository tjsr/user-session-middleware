import * as dotenv from 'dotenv-flow';
import * as expressSession from 'express-session';

import { IncomingHttpHeaders } from 'http';
import express from 'express';
import session from 'express-session';
import { uuid4 } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new session.MemoryStore();

dotenv.config();
const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;

export const getSession = (useSessionStore: expressSession.Store = memoryStore) => {
  return session({
    cookie: {
      maxAge: IN_PROD ? TWO_HOURS : TWENTYFOUR_HOURS,
      path: '/',
      sameSite: true,
      secure: IN_PROD,
    },
    genid: function (req: express.Request) {
      const headers: IncomingHttpHeaders = req.headers;
      const sessionIdHeader: string | string[] | undefined =
        headers['x-session-id'];
      if (
        typeof sessionIdHeader === 'string' &&
        sessionIdHeader !== 'undefined'
      ) {
        return sessionIdHeader;
      }
      if (req.session?.id) {
        return req.session.id;
      }
      const cookieValue = req.cookies?.sessionId;
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        return cookieValue;
      }
      const newId: uuid4 = uuidv4(); // use UUIDs for session IDs
      return newId;
    },
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env['SESSION_SECRET'] || uuidv4(),
    store: useSessionStore !== undefined ? useSessionStore : memoryStore,
  });
};
