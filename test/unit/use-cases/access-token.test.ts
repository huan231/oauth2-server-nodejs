import t from 'tap';

import { AccessTokenRequest, makeHandleAccessTokenRequest } from '../../../src/use-cases/access-token';
import {
  HandleAuthorizationCodeGrant,
  HandleClientCredentialsGrant,
  HandleRefreshTokenGrant,
} from '../../../src/use-cases/grant-types';
import { noop } from '../test-utils';

t.test('access token', (t) => {
  t.plan(5);

  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  const tokenType = 'Bearer';
  const expiresIn = 900;

  const accessTokenResponse = { accessToken, tokenType, expiresIn };

  t.test('grant_type=authorization_code', async (t) => {
    t.plan(2);

    const handleAuthorizationCodeGrantMock: HandleAuthorizationCodeGrant = () => {
      t.ok(true);

      return Promise.resolve(accessTokenResponse);
    };

    const req = { body: { grantType: 'authorization_code' } } as AccessTokenRequest;

    const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
      handleClientAuthentication: noop,
      handleAuthorizationCodeGrant: handleAuthorizationCodeGrantMock,
      handleClientCredentialsGrant: noop,
      handleRefreshTokenGrant: noop,
    });

    const response = await handleAccessTokenRequest(req);

    t.equal(response, accessTokenResponse);
  });

  t.test('grant_type=client_credentials', async (t) => {
    t.plan(2);

    const handleClientCredentialsGrantMock: HandleClientCredentialsGrant = () => {
      t.ok(true);

      return Promise.resolve(accessTokenResponse);
    };

    const req = { body: { grantType: 'client_credentials' } } as AccessTokenRequest;

    const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
      handleClientAuthentication: noop,
      handleAuthorizationCodeGrant: noop,
      handleClientCredentialsGrant: handleClientCredentialsGrantMock,
      handleRefreshTokenGrant: noop,
    });

    const response = await handleAccessTokenRequest(req);

    t.equal(response, accessTokenResponse);
  });

  t.test('grant_type=refresh_token', async (t) => {
    t.plan(2);

    const handleRefreshTokenGrantMock: HandleRefreshTokenGrant = () => {
      t.ok(true);

      return Promise.resolve(accessTokenResponse);
    };

    const req = { body: { grantType: 'refresh_token' } } as AccessTokenRequest;

    const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
      handleClientAuthentication: noop,
      handleAuthorizationCodeGrant: noop,
      handleClientCredentialsGrant: noop,
      handleRefreshTokenGrant: handleRefreshTokenGrantMock,
    });

    const response = await handleAccessTokenRequest(req);

    t.equal(response, accessTokenResponse);
  });

  t.test('missing grant type', async (t) => {
    t.plan(1);

    const req = { body: {} } as AccessTokenRequest;

    const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
      handleClientAuthentication: noop,
      handleAuthorizationCodeGrant: noop,
      handleClientCredentialsGrant: noop,
      handleRefreshTokenGrant: noop,
    });

    await t.rejects(() => handleAccessTokenRequest(req), { error: 'invalid_request' });
  });

  t.test('unsupported grant type', async (t) => {
    t.plan(1);

    const req = { body: { grantType: 'password' } } as AccessTokenRequest;

    const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
      handleClientAuthentication: noop,
      handleAuthorizationCodeGrant: noop,
      handleClientCredentialsGrant: noop,
      handleRefreshTokenGrant: noop,
    });

    await t.rejects(() => handleAccessTokenRequest(req), { error: 'unsupported_grant_type' });
  });
});
