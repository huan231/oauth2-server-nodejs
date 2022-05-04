import t from 'tap';

import { makeHandleAuthorizationServerMetadataRequest } from '../../../src/use-cases/authorization-server-metadata';

t.test('authorization server metadata', (t) => {
  t.plan(2);

  const issuer = 'https://as.example.com';
  const authorizationEndpoint = 'https://as.example.com/authorize';
  const tokenEndpoint = 'https://as.example.com/token';
  const responseTypesSupported = ['code'];
  const grantTypesSupported = ['authorization_code', 'client_credentials', 'refresh_token'];

  t.test('with supported scopes', (t) => {
    t.plan(6);

    const scopes = ['api:read', 'api:write', 'api:delete'];

    const { handleAuthorizationServerMetadataRequest } = makeHandleAuthorizationServerMetadataRequest({
      issuer,
      scopes,
    });

    const authorizationServerMetadataResponse = handleAuthorizationServerMetadataRequest();

    t.equal(authorizationServerMetadataResponse.issuer, issuer);
    t.equal(authorizationServerMetadataResponse.authorizationEndpoint, authorizationEndpoint);
    t.equal(authorizationServerMetadataResponse.tokenEndpoint, tokenEndpoint);
    t.equal(authorizationServerMetadataResponse.scopesSupported, scopes);
    t.same(authorizationServerMetadataResponse.responseTypesSupported, responseTypesSupported);
    t.same(authorizationServerMetadataResponse.grantTypesSupported, grantTypesSupported);
  });

  t.test('without supported scopes', (t) => {
    t.plan(1);

    const { handleAuthorizationServerMetadataRequest } = makeHandleAuthorizationServerMetadataRequest({
      issuer,
      scopes: [],
    });

    const authorizationServerMetadataResponse = handleAuthorizationServerMetadataRequest();

    t.type(authorizationServerMetadataResponse.scopesSupported, 'undefined');
  });
});
