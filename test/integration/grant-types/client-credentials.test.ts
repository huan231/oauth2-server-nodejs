import t from 'tap';
import request from 'supertest';

import { makeApp } from '../test-utils';

t.test('oauth 2.0 client credentials grant', (t) => {
  t.plan(5);

  const clientId = 's6BhdRkqt3';
  const clientSecret = 'cf136dc3c1fc93f31185e5885805d';
  const scopes = ['api:read', 'api:write', 'api:delete'];

  const app = makeApp({
    storage: { clients: [{ clientId, clientSecret, redirectUris: [] }] },
    scopes,
  });

  t.test('issues an access token', async (t) => {
    t.plan(9);

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials' });

    t.equal(res.statusCode, 200);

    t.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    t.equal(res.headers['cache-control'], 'no-store');
    t.equal(res.headers['pragma'], 'no-cache');

    t.type(res.body.access_token, 'string');
    t.equal(res.body.token_type, 'Bearer');
    t.equal(res.body.expires_in, 3600);
    t.type(res.body.refresh_token, 'undefined');
    t.type(res.body.scope, 'undefined');
  });

  t.test('issues an access token using "client_secret_post" method', async (t) => {
    t.plan(1);

    const res = await request(app)
      .post('/token')
      .type('form')
      .send({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret });

    t.equal(res.statusCode, 200);
  });

  t.test('public client', async (t) => {
    t.plan(1);

    const app = makeApp({
      storage: { clients: [{ clientId, redirectUris: ['https://client.example.org/callback'] }] },
    });

    const res = await request(app)
      .post('/token')
      .type('form')
      .send({ grant_type: 'client_credentials', client_id: clientId });

    t.equal(res.statusCode, 401);
  });

  t.test('issues an access token with requested scopes', async (t) => {
    t.plan(2);

    const scope = 'api:read api:write';

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials', scope });

    t.equal(res.statusCode, 200);
    t.type(res.body.scope, scope);
  });

  t.test('the requested scope exceeds the supported set of scopes', async (t) => {
    t.plan(2);

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials', scope: 'api:manage' });

    t.equal(res.statusCode, 400);
    t.equal(res.body.error, 'invalid_scope');
  });
});
