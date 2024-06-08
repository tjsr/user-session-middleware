import { getSnowflake } from '../snowflake.js';
import { uuid5 } from '../../../tagtool/src/types.js';
import { v5 as uuidv5 } from 'uuid';

export const createRandomId = (namespace: string): uuid5 => {
  return uuidv5(getSnowflake().toString(), namespace);
};
