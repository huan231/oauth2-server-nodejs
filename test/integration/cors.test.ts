import t from 'tap';
import request from 'supertest';

import { makeApp } from './test-utils';

t.test('cross-origin resource sharing', (t) => {
  t.plan(3);

  const app = makeApp();

  t.test('access token request preflight', async (t) => {
    t.plan(5);

    const res = await request(app).options('/token');

    t.equal(res.statusCode, 204);

    t.equal(res.headers['access-control-allow-origin'], '*');
    t.equal(res.headers['access-control-allow-headers'], 'Authorization');
    t.equal(res.headers['access-control-allow-methods'], 'POST');
    t.equal(res.headers['access-control-expose-headers'], 'WWW-Authenticate');
  });

  t.test('authorization server metadata request preflight', async (t) => {
    t.plan(3);

    const res = await request(app).options('/.well-known/oauth-authorization-server');

    t.equal(res.statusCode, 204);

    t.equal(res.headers['access-control-allow-origin'], '*');
    t.equal(res.headers['access-control-allow-methods'], 'GET');
  });

  t.test('jwks request preflight', async (t) => {
    t.plan(3);

    const res = await request(app).options('/jwks.json');

    t.equal(res.statusCode, 204);

    t.equal(res.headers['access-control-allow-origin'], '*');
    t.equal(res.headers['access-control-allow-methods'], 'GET');
  });
});
