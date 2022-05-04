import t from 'tap';
import request from 'supertest';

import { makeApp } from './test-utils';

t.test('authorization server metadata', async (t) => {
  t.plan(8);

  const scopes = ['api:read', 'api:write', 'api:delete'];

  const app = makeApp({ scopes });

  const res = await request(app).get('/.well-known/oauth-authorization-server');

  t.equal(res.statusCode, 200);

  t.equal(res.body.issuer, 'https://as.example.com');
  t.equal(res.body.authorization_endpoint, 'https://as.example.com/authorize');
  t.equal(res.body.token_endpoint, 'https://as.example.com/token');
  t.equal(res.body.jwks_uri, 'https://as.example.com/jwks.json');
  t.same(res.body.scopes_supported, scopes);
  t.same(res.body.response_types_supported, ['code']);
  t.same(res.body.grant_types_supported, ['authorization_code', 'client_credentials', 'refresh_token']);
});
