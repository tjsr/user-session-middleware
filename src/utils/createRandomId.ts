import { IdNamespace, uuid5 } from '../types.js';
import { v5 as uuidv5, validate as validateUuid } from 'uuid';

import { getSnowflake } from '../snowflake.js';

export const createRandomId = (namespace: IdNamespace): uuid5 => {
  if (!validateUuid(namespace)) {
    throw new TypeError(`Invalid UUID ${namespace?.toString()} namespace provided.`);
  }
  return uuidv5(getSnowflake().toString(), namespace);
};
