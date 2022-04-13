import t from 'tap';
import { ErrorRequestHandler } from 'express';
import request from 'supertest';

import { makeApp } from './test-utils';
import { Unauthenticated, UnresolvedAuthorization } from '../../src';

t.test('error fallthrough', (t) => {
  t.plan(2);

  const clientId = 's6BhdRkqt3';
  const redirectUri = 'https://client.example.org/callback';
  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';

  const searchParams = new URLSearchParams();

  searchParams.set('response_type', 'code');
  searchParams.set('client_id', clientId);

  t.test('unauthenticated error', async (t) => {
    t.plan(1);

    const app = makeApp({
      authenticate: () => (client, req) => Promise.reject(new Unauthenticated(client, req)),
      authorize: () => () => Promise.resolve(true),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
    });

    const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
      t.ok(err instanceof Unauthenticated);

      next(err);
    };

    app.use(errorHandler);

    await request(app).get(`/authorize?${searchParams}`);
  });

  t.test('unresolved authorization error', async (t) => {
    t.plan(1);

    const app = makeApp({
      authenticate: () => () => Promise.resolve(subject),
      authorize: () => (client, req) => Promise.reject(new UnresolvedAuthorization(client, req)),
      storage: { clients: [{ clientId, redirectUris: [redirectUri] }] },
    });

    const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
      t.ok(err instanceof UnresolvedAuthorization);

      next(err);
    };

    app.use(errorHandler);

    await request(app).get(`/authorize?${searchParams}`);
  });
});
