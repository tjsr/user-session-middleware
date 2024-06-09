import { IdNamespace, uuid5 } from '../types.js';

import { getSnowflake } from '../snowflake.js';
import { v5 as uuidv5 } from 'uuid';

export const createRandomId = (namespace: IdNamespace): uuid5 => {
  return uuidv5(getSnowflake().toString(), namespace);
};
