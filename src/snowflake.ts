import { SnowflakeType } from './types.js';
import { Worker } from 'snowflake-uuid';

const generator = new Worker(0, 1, {
  datacenterIdBits: 5,
  sequenceBits: 12,
  workerIdBits: 5,
});

export const getSnowflake = (): SnowflakeType => {
  return generator.nextId();
};
