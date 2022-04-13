import t from 'tap';

import { Client, RefreshToken, RefreshTokenStorage } from '../../../../src/models';
import { HandleClientAuthentication } from '../../../../src/use-cases/client-authentication';
import { AccessTokenRequest } from '../../../../src/use-cases/access-token';
import { makeHandleRefreshTokenGrant } from '../../../../src/use-cases/grant-types';
import { noop } from '../../test-utils';
import { IssueAccessToken } from '../../../../src/use-cases/issue-access-token';
import { IssueRefreshToken } from '../../../../src/use-cases/issue-refresh-token';

t.test('refresh token grant', (t) => {
  t.plan(6);

  const client = { clientId: 's6BhdRkqt3' } as Client;

  const handleClientAuthenticationStub: HandleClientAuthentication = () => {
    return Promise.resolve(client);
  };

  t.test('missing a required parameter "refresh_token"', async (t) => {
    t.plan(1);

    const req = { body: {} } as AccessTokenRequest;

    const refreshTokenStorageStub = {} as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage: refreshTokenStorageStub,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleRefreshTokenGrant(req), { error: 'invalid_request' });
  });

  t.test('refresh token is invalid', async (t) => {
    t.plan(1);

    const req = { body: { refreshToken: 'f5098b64734a88e6929912905d671cb7513e7233' } } as AccessTokenRequest;

    const findRefreshTokenStub: RefreshTokenStorage['findRefreshToken'] = () => {
      return Promise.resolve(null);
    };

    const refreshTokenStorage = { findRefreshToken: findRefreshTokenStub } as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleRefreshTokenGrant(req), { error: 'invalid_grant' });
  });

  t.test('refresh token is expired', async (t) => {
    t.plan(2);

    const req = { body: { refreshToken: 'f5098b64734a88e6929912905d671cb7513e7233' } } as AccessTokenRequest;
    const refreshToken = { expirationTime: 0 } as RefreshToken;

    const findRefreshTokenStub: RefreshTokenStorage['findRefreshToken'] = () => {
      return Promise.resolve(refreshToken);
    };
    const deleteRefreshTokenMock: RefreshTokenStorage['deleteRefreshToken'] = () => {
      t.ok(true);

      return Promise.resolve();
    };

    const refreshTokenStorage = {
      findRefreshToken: findRefreshTokenStub,
      deleteRefreshToken: deleteRefreshTokenMock,
    } as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleRefreshTokenGrant(req), { error: 'invalid_grant' });
  });

  t.test('invalid value for parameter "scope"', async (t) => {
    t.plan(1);

    const scope = 'api:read api:write';
    const req = { body: { refreshToken: 'f5098b64734a88e6929912905d671cb7513e7233', scope } } as AccessTokenRequest;
    const refreshToken = { expirationTime: Infinity } as RefreshToken;

    const findRefreshTokenStub: RefreshTokenStorage['findRefreshToken'] = () => {
      return Promise.resolve(refreshToken);
    };

    const refreshTokenStorage = { findRefreshToken: findRefreshTokenStub } as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleRefreshTokenGrant(req), { error: 'invalid_scope' });
  });

  t.test('scope defaults to previously granted', async (t) => {
    t.plan(3);

    const scope = 'api:read api:write';
    const req = { body: { refreshToken: 'f5098b64734a88e6929912905d671cb7513e7233' } } as AccessTokenRequest;
    const refreshToken = { scope, expirationTime: Infinity } as RefreshToken;

    const findRefreshTokenStub: RefreshTokenStorage['findRefreshToken'] = () => {
      return Promise.resolve(refreshToken);
    };
    const issueAccessTokenMock: IssueAccessToken = (params) => {
      t.match(params, { scope });

      return Promise.resolve('');
    };
    const issueRefreshTokenMock: IssueRefreshToken = (params) => {
      t.match(params, { scope });

      return Promise.resolve('');
    };
    const deleteRefreshTokenStub: RefreshTokenStorage['deleteRefreshToken'] = () => {
      return Promise.resolve();
    };

    const refreshTokenStorage = {
      findRefreshToken: findRefreshTokenStub,
      deleteRefreshToken: deleteRefreshTokenStub,
    } as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage,
      issueAccessToken: issueAccessTokenMock,
      issueRefreshToken: issueRefreshTokenMock,
    });

    const accessTokenResponse = await handleRefreshTokenGrant(req);

    t.match(accessTokenResponse, { scope });
  });

  t.test('access token response', async (t) => {
    t.plan(2);

    const req = { body: { refreshToken: 'f5098b64734a88e6929912905d671cb7513e7233' } } as AccessTokenRequest;
    const refreshToken = { expirationTime: Infinity } as RefreshToken;
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const newRefreshToken = 'eb4a4a58e5db31e5da759190e10510f690716554';

    const findRefreshTokenStub: RefreshTokenStorage['findRefreshToken'] = () => {
      return Promise.resolve(refreshToken);
    };
    const issueAccessTokenStub: IssueAccessToken = () => {
      return Promise.resolve(accessToken);
    };
    const issueRefreshTokenStub: IssueRefreshToken = () => {
      return Promise.resolve(newRefreshToken);
    };
    const deleteRefreshTokenMock: RefreshTokenStorage['deleteRefreshToken'] = () => {
      t.ok(true);

      return Promise.resolve();
    };

    const refreshTokenStorage = {
      findRefreshToken: findRefreshTokenStub,
      deleteRefreshToken: deleteRefreshTokenMock,
    } as RefreshTokenStorage;

    const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      refreshTokenStorage,
      issueAccessToken: issueAccessTokenStub,
      issueRefreshToken: issueRefreshTokenStub,
    });

    const accessTokenResponse = await handleRefreshTokenGrant(req);

    t.match(accessTokenResponse, { accessToken, tokenType: 'Bearer', refreshToken: newRefreshToken });
  });
});
