# TO-DO items for user-session-middleware

- Refactor all error code and classes in to the error/ directory
- Adjust vitest.config to set the timeout based on whether we're in debug mode or with a debugger attached.
- Export only a single middleware and error handler
- Add settings/options to be taken in with middleware loader.
- Use a log library to better define log output in test modes.
- Rework integration test end and error handlers.