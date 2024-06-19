import { describe, test } from 'vitest';

describe('login', () => {
  test.todo('Should call next with a validationerror if the email is invalid', () => {
    
  });
  test.todo('Should call next with an error if the session fails to save', () => {

  });
  test.todo('Should call next with an error if the user is not found', () => {

  });

  test.todo('Should not call session.save if the user is not found', () => {
    // This would be done by the end session handler.
  });

  test.todo('Should send an OK response with a valid user', () => {

  });

  test.todo('Should not call session.save with a valid user', () => {
    // This would be done by the end session handler.
    
  });

  test.todo('Should not call res.cookie with a valid user', () => {
    // This should be called by another handler in the chain.

  });

  test.todo('Should ensure that session.cookie handler has NOT been called before processing login', () => {

  });

  test.todo('Should set the userId and email on the session to the retrieved users details', () => {

  });
});
