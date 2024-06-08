import { login } from './login.js';
import { logout } from './logout.js';
import { session } from './session.js';
// app.get('/session', session);
// app.post('/login', login);
// app.get('/logout', logout);
// app.post('/logout', logout);

export const userSessionEndpoints = [
  session, login, logout,
];
