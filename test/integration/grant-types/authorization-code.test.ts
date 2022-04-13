import t from 'tap';
import request from 'supertest';

import { makeApp } from '../test-utils';

t.test('oauth 2.0 authorization code grant', (t) => {
  t.plan(4);

  const clientId = 's6BhdRkqt3';
  const redirectUri = 'https://client.example.org/callback';
  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';
  const scopes = ['api:read', 'api:write', 'api:delete'];

  t.test('authenticate resource owner, grant access and issue an access token', async (t) => {
    t.plan(11);

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => () => Promise.resolve(true),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
    });

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);
    searchParams.set('redirect_uri', redirectUri);

    let res = await request(app).get(`/authorize?${searchParams}`);

    const url = new URL(res.headers['location']);

    t.equal(url.origin.concat(url.pathname), redirectUri);
    t.type(url.searchParams.get('code'), 'string');

    const code = url.searchParams.get('code');

    res = await request(app)
      .post('/token')
      .type('form')
      .send({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId });

    t.equal(res.statusCode, 200);

    t.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    t.equal(res.headers['cache-control'], 'no-store');
    t.equal(res.headers['pragma'], 'no-cache');

    t.type(res.body.access_token, 'string');
    t.equal(res.body.token_type, 'Bearer');
    t.equal(res.body.expires_in, 900);
    t.type(res.body.refresh_token, 'string');
    t.type(res.body.scope, 'undefined');
  });

  t.test('access denied', async (t) => {
    t.plan(1);

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => () => Promise.resolve(false),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
    });

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);
    searchParams.set('redirect_uri', redirectUri);

    const res = await request(app).get(`/authorize?${searchParams}`);

    const url = new URL(res.headers['location']);

    t.type(url.searchParams.get('error'), 'access_denied');
  });

  t.test('csrf protection', async (t) => {
    t.plan(1);

    const state = 'cf136dc3c1fc93f31185e5885805d';

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => () => Promise.resolve(true),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
    });

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);
    searchParams.set('redirect_uri', redirectUri);
    searchParams.set('state', state);

    const res = await request(app).get(`/authorize?${searchParams}`);

    const url = new URL(res.headers['location']);

    t.type(url.searchParams.get('state'), state);
  });

  t.test('issues an access token with requested scopes', async (t) => {
    t.plan(2);

    const scope = 'api:read api:write';

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => () => Promise.resolve(true),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
      scopes,
    });

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);
    searchParams.set('redirect_uri', redirectUri);
    searchParams.set('scope', scope);

    let res = await request(app).get(`/authorize?${searchParams}`);

    const url = new URL(res.headers['location']);

    const code = url.searchParams.get('code');

    res = await request(app)
      .post('/token')
      .type('form')
      .send({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId });

    t.equal(res.statusCode, 200);
    t.type(res.body.scope, scope);
  });
});
