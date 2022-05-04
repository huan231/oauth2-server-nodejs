import { Buffer } from 'buffer';

import t from 'tap';
import request from 'supertest';

import { makeApp } from './test-utils';

t.test('json web token', (t) => {
  t.plan(1);

  const clientId = 's6BhdRkqt3';
  const clientSecret = 'cf136dc3c1fc93f31185e5885805d';
  const scopes = ['api:read', 'api:write', 'api:delete'];

  const app = makeApp({
    storage: { clients: [{ clientId, clientSecret, redirectUris: [] }] },
    scopes,
  });

  t.test('issues a jwt', async (t) => {
    t.plan(4);

    const scope = 'api:read api:write';

    const res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials', scope });

    const components = res.body.access_token.split('.');

    t.equal(components.length, 3);

    const [protectedHeader, payload, signature] = components;

    t.match(JSON.parse(Buffer.from(protectedHeader, 'base64url').toString()), {
      typ: 'JWT',
      kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
      alg: 'EdDSA',
    });
    t.match(JSON.parse(Buffer.from(payload, 'base64url').toString()), {
      iss: 'https://as.example.com',
      sub: clientId,
      exp: Number,
      iat: Number,
      scope,
    });
    t.type(signature, 'string');
  });
});
