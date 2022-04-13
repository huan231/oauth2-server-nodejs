import t from 'tap';
import request from 'supertest';

import { makeApp } from './test-utils';

t.test('redirect uri', (t) => {
  t.plan(3);

  const clientId = 's6BhdRkqt3';
  const redirectUri = 'https://client.example.org/callback';
  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';

  const app = makeApp({
    authenticate: () => () => Promise.resolve(subject),
    authorize: () => () => Promise.resolve(true),
    storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
  });

  t.test('invalid redirect uri', async (t) => {
    t.plan(2);

    const redirectUri = 'https://client.example.org/callback2';

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);
    searchParams.set('redirect_uri', redirectUri);

    const res = await request(app).get(`/authorize?${searchParams}`);

    t.equal(res.statusCode, 400);
    t.equal(res.body.error, 'invalid_request');
  });

  t.test('implicit redirect uri', async (t) => {
    t.plan(1);

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);

    const res = await request(app).get(`/authorize?${searchParams}`);

    const url = new URL(res.headers['location']);

    t.equal(url.origin.concat(url.pathname), redirectUri);
  });

  t.test('missing redirect uri', async (t) => {
    t.plan(2);

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => () => Promise.resolve(true),
      storage: { clients: [{ clientId, redirectUris: [redirectUri, 'https://client.example.org/callback2'] }] },
    });

    const searchParams = new URLSearchParams();

    searchParams.set('response_type', 'code');
    searchParams.set('client_id', clientId);

    const res = await request(app).get(`/authorize?${searchParams}`);

    t.equal(res.statusCode, 400);
    t.equal(res.body.error, 'invalid_request');
  });
});
