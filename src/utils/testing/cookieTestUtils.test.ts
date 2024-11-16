import { getSessionIdFromSetCookieString } from './cookieTestUtils.js';

describe('getSessionIdFromSetCookieString', () => {
  test('Should return a sessionId value in a string with path.', () => {
    const unsignedTestString = 'sessionId=d569a638-3fec-4e29-9b86-52f006ca45e4; Path=/; HttpOnly; SameSite=Strict';

    expect(getSessionIdFromSetCookieString(unsignedTestString, 'sessionId', 'foo')).toEqual(
      'd569a638-3fec-4e29-9b86-52f006ca45e4'
    );
  });

  test('Should throw exception if no secret is provided.', () => {
    const signedTestString = 'sessionId=s:d569a638-3fec-4e29-9b86-52f006ca45e4...; Path=/; HttpOnly; SameSite=Strict';

    expect(() => getSessionIdFromSetCookieString(signedTestString, 'sessionId', undefined)).toThrow(expect.any(Error));
  });

  test('Should throw exception if invalid secret is provided.', () => {
    const signedTestString =
      'sessionId=s:d569a638-3fec-4e29-9b86-52f006ca45e4.Ea6SEViRnJZE+HOIcpPE0MLvCI/nU+pCeSSIhJAmrh8; Path=/; HttpOnly; SameSite=Strict';

    expect(() => getSessionIdFromSetCookieString(signedTestString, 'sessionId', 'blah')).toThrowError(
      /Parsed cookie s:.* did not match session secret blah./
    );
  });

  test('Should return cookie with alternative sid key value in a string with path.', () => {
    const testString =
      'test.sid=s:d569a638-3fec-4e29-9b86-52f006ca45e4.Ea6SEViRnJZE+HOIcpPE0MLvCI/nU+pCeSSIhJAmrh8; Path=/; HttpOnly; SameSite=Strict';

    expect(getSessionIdFromSetCookieString(testString, 'test.sid', 'foo')).toEqual(
      'd569a638-3fec-4e29-9b86-52f006ca45e4'
    );
  });
});
