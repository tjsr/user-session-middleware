/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, it, test } from "vitest"

describe('Test before', () => {

  beforeEach(async (context: any) => {
    console.log(context.name);
  });

  test('First test', (context) => {
    // context.name = 'first';
  });
});
