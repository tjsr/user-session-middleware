import {
  ERROR_RETRIEVING_SESSION_DATA,
  ERROR_SAVING_SESSION,
  ERROR_SESSION_NOT_INITIALIZED,
  INVALID_SESSION_ID_FORMAT,
  NEW_SESSION_ID_DATA_EXISTS,
  NO_SESSION_DATA_FROM_STORE,
  NO_SESSION_ID_FOR_NEW_REQUEST_TRUE,
  NO_SESSION_ID_IN_REQUEST,
  NO_SESSION_ID_ON_SESSION,
  PREREQUISITE_HANDLER_NOT_CALLED,
  REQUIRED_MIDDLEWARE_NOT_CALLED,
  SESSION_ID_NOT_GENERATED,
  SESSION_ID_TYPE_ERROR,
  SET_COOKIE_NOT_PERMITTED,
} from './errorCodes.js';

import { HttpStatusCode } from '../httpStatusCodes.js';

type SessionErrorValueDefaults = {
  message: string;
  status: HttpStatusCode;
};

// prettier-ignore
export const DEFAULT_ERROR_CODES: Map<number, SessionErrorValueDefaults> = new Map(
  [
    [INVALID_SESSION_ID_FORMAT, { message: "Invalid session ID format.", status: HttpStatusCode.BAD_REQUEST }],
    [SESSION_ID_NOT_GENERATED, { message: "No session ID in generated.", status: HttpStatusCode.BAD_REQUEST }],
    [NO_SESSION_ID_IN_REQUEST, { message: "No session ID in request.", status: HttpStatusCode.UNAUTHORIZED }],
    [SESSION_ID_TYPE_ERROR, { message: "Session ID is invalid data type.", status: HttpStatusCode.BAD_REQUEST }],
    [NO_SESSION_DATA_FROM_STORE,
      { message: "No session data found for session ID.", status: HttpStatusCode.UNAUTHORIZED }],
    [NO_SESSION_ID_FOR_NEW_REQUEST_TRUE,
      { message: "No sessionID, but got new ID generated on request.", status: HttpStatusCode.BAD_REQUEST }],
    [NEW_SESSION_ID_DATA_EXISTS, {
      message: "New session ID generated but session data already exists - this should never happen.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_RETRIEVING_SESSION_DATA, {
      message: "Error getting session data from data store.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_SESSION_NOT_INITIALIZED, {
      message: "Session data on request not yet initialized.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [PREREQUISITE_HANDLER_NOT_CALLED, {
      message: "Prerequisite method was not called.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_SAVING_SESSION, {
      message: "Error writing session data to store.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [NO_SESSION_ID_ON_SESSION, {
      message: "Request sessionID not defined on session.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [REQUIRED_MIDDLEWARE_NOT_CALLED, {
      message: "Prerequisite middleware was not called.",
      status: HttpStatusCode.NOT_IMPLEMENTED }],
    [SET_COOKIE_NOT_PERMITTED, {
      message: "Set-Cookie not permitted in request, header should be Cookie.",
      status: HttpStatusCode.BAD_REQUEST }],
  ]
);
