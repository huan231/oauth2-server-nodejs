import t from 'tap';
import request from 'supertest';

import { makeApp } from '../test-utils';

t.test('oauth 2.0 refresh token', (t) => {
  t.plan(6);

  const clientId = 's6BhdRkqt3';
  const clientSecret = 'cf136dc3c1fc93f31185e5885805d';
  const refreshToken = 'f5098b64734a88e6929912905d671cb7513e7233';
  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';

  t.test('refresh access token', async (t) => {
    t.plan(10);

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: Infinity }],
      },
    });

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken });

    t.equal(res.statusCode, 200);

    t.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    t.equal(res.headers['cache-control'], 'no-store');
    t.equal(res.headers['pragma'], 'no-cache');

    t.type(res.body.access_token, 'string');
    t.equal(res.body.token_type, 'Bearer');
    t.equal(res.body.expires_in, 900);
    t.type(res.body.refresh_token, 'string');
    t.not(res.body.refresh_token, refreshToken);
    t.type(res.body.scope, 'undefined');
  });

  t.test('refresh token is invalid, expired or revoked', async (t) => {
    t.plan(2);

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: 0 }],
      },
    });

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken });

    t.equal(res.statusCode, 400);
    t.equal(res.body.error, 'invalid_grant');
  });

  t.test('reuse scope from previous refresh token', async (t) => {
    t.plan(2);

    const scope = 'api:read api:write';

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: Infinity, scope }],
      },
    });

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken });

    t.equal(res.statusCode, 200);
    t.equal(res.body.scope, scope);
  });

  t.test('downlevel previously requested scope', async (t) => {
    t.plan(2);

    const scope = 'api:read';

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: Infinity, scope: 'api:read api:write' }],
      },
    });

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken, scope });

    t.equal(res.statusCode, 200);
    t.equal(res.body.scope, scope);
  });

  t.test('requested scope exceeds previously granted scope', async (t) => {
    t.plan(2);

    const scope = 'api:read api:write';

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: Infinity, scope: 'api:read' }],
      },
    });

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken, scope });

    t.equal(res.statusCode, 400);
    t.equal(res.body.error, 'invalid_scope');
  });

  t.test('revoke old refresh token', async (t) => {
    t.plan(2);

    const app = makeApp({
      storage: {
        clients: [{ clientId, clientSecret, redirectUris: [] }],
        refreshTokens: [{ refreshToken, subject, clientId, expirationTime: Infinity }],
      },
    });

    let res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken });

    t.equal(res.statusCode, 200);

    res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'refresh_token', refresh_token: refreshToken });

    t.equal(res.statusCode, 400);
  });
});
