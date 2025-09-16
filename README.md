# user-session-middleware

[![npm version](https://img.shields.io/npm/v/npm.svg)](https://npm.im/npm)
[![CI - cli](https://github.com/tjsr/user-session-middleware/actions/workflows/build.yml/badge.svg)](https://github.com/tjsr/user-session-middleware/actions/workflows/build.yml)

Shared middleware code for session handling and security handling of requests, and authenticating sessions against oauth credentials.

This code wraps express-session, but significant additional checks to protect against bruteforce attacks, re-use of existing session IDs, session ID regeneration, and login/logout/session regneration calls.

## Requirements

Expects `node@20.12.1` or higher but is built on 20.15.1 presently.  
`npm@10.8.2` is required by workflows due to json schema changes in 10.8.1 and higher.
`express@>=4` must be provided by the parent app including this library.

Nodemon can be used optionally to watch and re-build on changes automatically.

## Usage

To include in a project, you'll need an express server object created.  Pass it to the main function using:

```typescript
  import { UserSessionOptions, useUserSessionMiddleware } from '@tjsr/user-session-middleware';
  import { mysqlSessionStore } from '@tjsr/user-session-middleware';
```

```typescript
  const sessionOptions: Partial<UserSessionOptions> = {
    skipExposeHeaders: false,
    store: mysqlSessionStore,
  };
  const app: express.Express = express();

  useUserSessionMiddleware(app, sessionOptions);
```

## Configuration options

USM currently has the following config options:

- rejectUnrecognizedSessionId - Return a 401 if the session id is not recognized in store
- validateMiddlewareDependencies - Check and throw an error if a middleware call that's expected didn't occur
- skipExposeHeaders - Don't set * as the Access-Control-Allow-Origin header
- useForwardedSessions - Look for the session id in the X-Session-Id header
- disableSessionRefresh - Don't permit a session ID to be renewed by calling /session
- disableLoginEndpoints - Don't bind the /login and /logout endpoints
- userIdNamespace - The UUID namespace to separate out generated User IDs to ensure unuqieness across systems.

- logoutPath - default `/logout` - the GET/POST URL available to invalidate the user and log out.
- loginPath - default `/login` - the GET/POST URL available to authenticate the user.
- sessionPath - default `/session` - the GET/POST URL available to forcibly regenerate and assign a new session ID.

## Repo configuration

The workflow files for this repo require the NODE_VERSION and NPM_VERSION var to be specified.

```bash
  gh auth login
  gh variable set NODE_VERSION -b "22.19.0"
  gh variable set NPM_VERSION -b "11.6.0"
```

## Dependabot

The repo will requires an NPM_TOKEN to update npm dependencies using dependabot.  
`gh secret set NPM_TOKEN --app dependabot --body "$NPM_TOKEN"`

### Building

First, `npm install` for dependencies.  To verify everything is okay, `npm build` and `npm test`.

## Contact

For details, questions, or requests, contact Tim Rowe <tim@tjsr.id.au>
