import { IPAddress } from '../types.js';
import express from "express";

export const getIp = (req: express.Request): IPAddress | undefined => {
  try {
    if (req.headers.forwarded) {
      const forwardedForHeader: string | undefined = req.headers.forwarded
        .split(';')
        .find((header: string) => header?.startsWith('for='));
      const forParts: string[] | undefined = forwardedForHeader?.split('=');
      if (forParts !== undefined && forParts.length == 2) {
        return forParts[1];
      }
    }
  } catch (err) {
    console.warn("Got part of forwarded header, but couldn't parse it.");
  }
  return req.clientIp;
};

