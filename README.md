# user-session-middleware

[![npm version](https://img.shields.io/npm/v/npm.svg)](https://npm.im/npm)
[![CI - cli](https://github.com/tjsr/user-session-middleware/actions/workflows/build.yml/badge.svg)](https://github.com/tjsr/user-session-middleware/actions/workflows/build.yml)

Shared middleware code for session handling and security handling of requests, and authenticating sessions against oauth credentials.

This code wraps express-session, but significant additional checks to protect against bruteforce attacks, re-use of existing session IDs, session ID regeneration, and login/logout/session regneration calls.

## Requirements

Requires Node.js 24.21.0 or later and npm 12.1.0 or later. The version-bump
workflow uses Node.js 24.21.0 and npm 12.2.1. CI verifies Node 24 and 26, with
Node 22 retained as a diagnostic lane.

The parent application must provide `express@^5.3.0`.

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

The version-bump workflow selects its Node/npm versions directly. Other workflows
that use repository variables should match the supported toolchain.

```bash
  gh auth login
  gh variable set NODE_VERSION -b "24.21.0"
  gh variable set NPM_VERSION -b "12.2.1"
```

## Dependabot

The repo will requires an NPM_TOKEN to update npm dependencies using dependabot.  
`gh secret set NPM_TOKEN --app dependabot --body "$NPM_TOKEN"`

### Building

First, `npm install` for dependencies.  To verify everything is okay, `npm build` and `npm test`.

## Contact

For details, questions, or requests, contact Tim Rowe <tim@tjsr.id.au>

Version 0.2.2 requires mysql-pool-utils 0.2.2 and targets Express 5.3 or later
within Express 5, with matching
Express 5 TypeScript types. Node 24.21.0+ and npm 12.1.0+ are required by
its dependencies; Node 24/26 are supported and Node 22 is diagnostic in CI.
The test-only vitest-mock-express type dependency is aligned with the project's
Express 5 types. Its factories contain no Express runtime dependency; real HTTP
login/session tests also run against Express 5.

Version 0.2.1 finishes handled JSON and authentication error responses without
forwarding them into Express's default error handler. Unhandled errors and
errors after headers have been sent still propagate to the application.
Packed ESM and CommonJS checks make real HTTP requests to verify response completion.

Version 0.2.2 supplies the production declaration dependencies needed by strict
TypeScript consumers. The public options retain express-session's SessionOptions
contract, including Buffer/KeyObject secrets, key rotation, and per-request cookie
callbacks. The defaults builder merges its cookie defaults into each callback
result; the deprecated manual-cookie helper and its test fixtures require string
secrets.

The unchanged MIT-licensed express-mysql-session 3.0.8 declarations are bundled
with a documented metadata-only patch: their mysql2 dependency is 3.10.2 instead
of 3.9.8, matching express-mysql-session 3.0.3. The archive, expanded source,
license, upstream integrity and maintenance notes are in [vendor/README.md](vendor/README.md).
Consumers receive the provider and its dependency closure in the middleware
package without remote-package opt-ins or source-checkout paths.

The verified [0.2.2 publication](https://github.com/tjsr/user-session-middleware/actions/runs/41916962187)
passed exact published ESM/CommonJS type, runtime and real HTTP package checks.
