import { Worker } from 'snowflake-uuid';

import { SnowflakeType } from './types.ts';

const generator = new Worker(0, 1, {
  datacenterIdBits: 5,
  sequenceBits: 12,
  workerIdBits: 5,
});

export const getSnowflake = (): SnowflakeType => {
  return generator.nextId();
};
