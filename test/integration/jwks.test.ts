import { Buffer } from 'buffer';
import { JsonWebKey } from 'crypto';

import t from 'tap';
import request from 'supertest';

const { createPublicKey } = await import('crypto');

import { makeApp } from './test-utils';
import { jws } from '../../src/utils';

t.test('json web key set', (t) => {
  t.plan(2);

  const clientId = 's6BhdRkqt3';
  const clientSecret = 'cf136dc3c1fc93f31185e5885805d';

  const app = makeApp({
    storage: { clients: [{ clientId, clientSecret, redirectUris: [] }] },
  });

  t.test('jwks response', async (t) => {
    t.plan(3);

    const res = await request(app).get('/jwks.json');

    t.equal(res.statusCode, 200);

    t.ok(Array.isArray(res.body.keys));

    const [jwk] = res.body.keys;

    t.type(jwk.kid, 'string');
  });

  t.test('verify access token with public key', async (t) => {
    t.plan(1);

    let res = await request(app)
      .post('/token')
      .auth(clientId, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials' });

    const accessToken = res.body.access_token;

    res = await request(app).get('/jwks.json');

    const [protectedHeader] = accessToken.split('.');

    const { kid } = JSON.parse(Buffer.from(protectedHeader, 'base64url').toString());

    const key = res.body.keys.find((key: JsonWebKey) => key.kid === kid);

    const publicKey = createPublicKey({ key, format: 'jwk' });

    const isValid = await jws.verify(accessToken, publicKey);

    t.ok(isValid);
  });
});
