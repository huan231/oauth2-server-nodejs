import t from 'tap';

import { makeHandleAuthorizationCodeGrant } from '../../../../src/use-cases/grant-types';
import { noop } from '../../test-utils';
import { AuthorizationCode, AuthorizationCodeStorage, Client } from '../../../../src/models';
import { AccessTokenRequest } from '../../../../src/use-cases/access-token';
import { HandleClientAuthentication } from '../../../../src/use-cases/client-authentication';
import { IssueAccessToken } from '../../../../src/use-cases/issue-access-token';
import { IssueRefreshToken } from '../../../../src/use-cases/issue-refresh-token';

t.test('authorization code grant', (t) => {
  t.plan(5);

  const client = { clientId: 's6BhdRkqt3' } as Client;

  const handleClientAuthenticationStub: HandleClientAuthentication = () => {
    return Promise.resolve(client);
  };

  t.test('missing a required parameter "code"', async (t) => {
    t.plan(1);

    const req = { body: {} } as AccessTokenRequest;

    const authorizationCodeStorageStub = {} as AuthorizationCodeStorage;

    const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      authorizationCodeStorage: authorizationCodeStorageStub,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleAuthorizationCodeGrant(req), { error: 'invalid_request' });
  });

  t.test('authorization code is invalid', async (t) => {
    t.plan(1);

    const req = { body: { code: 'eb4a4a58e5db31e5da759190e10510f690716554' } } as AccessTokenRequest;

    const findAuthorizationCodeStub: AuthorizationCodeStorage['findAuthorizationCode'] = () => {
      return Promise.resolve(null);
    };

    const authorizationCodeStorage = { findAuthorizationCode: findAuthorizationCodeStub } as AuthorizationCodeStorage;

    const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      authorizationCodeStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleAuthorizationCodeGrant(req), { error: 'invalid_grant' });
  });

  t.test('authorization code is expired', async (t) => {
    t.plan(2);

    const req = { body: { code: 'eb4a4a58e5db31e5da759190e10510f690716554' } } as AccessTokenRequest;
    const authorizationCode = { expirationTime: 0 } as AuthorizationCode;

    const findAuthorizationCodeStub: AuthorizationCodeStorage['findAuthorizationCode'] = () => {
      return Promise.resolve(authorizationCode);
    };
    const deleteAuthorizationCodeMock: AuthorizationCodeStorage['deleteAuthorizationCode'] = () => {
      t.ok(true);

      return Promise.resolve();
    };

    const authorizationCodeStorage = {
      findAuthorizationCode: findAuthorizationCodeStub,
      deleteAuthorizationCode: deleteAuthorizationCodeMock,
    } as AuthorizationCodeStorage;

    const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      authorizationCodeStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleAuthorizationCodeGrant(req), { error: 'invalid_grant' });
  });

  t.test('invalid value for parameter "redirect_uri"', async (t) => {
    t.plan(1);

    const req = { body: { code: 'eb4a4a58e5db31e5da759190e10510f690716554' } } as AccessTokenRequest;
    const authorizationCode = {
      redirectUri: 'https://client.example.org/callback',
      expirationTime: Infinity,
    } as AuthorizationCode;

    const findAuthorizationCodeStub: AuthorizationCodeStorage['findAuthorizationCode'] = () => {
      return Promise.resolve(authorizationCode);
    };

    const authorizationCodeStorage = { findAuthorizationCode: findAuthorizationCodeStub } as AuthorizationCodeStorage;

    const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      authorizationCodeStorage,
      issueAccessToken: noop,
      issueRefreshToken: noop,
    });

    await t.rejects(() => handleAuthorizationCodeGrant(req), { error: 'invalid_request' });
  });

  t.test('access token response', async (t) => {
    t.plan(2);

    const scope = 'api:read api:write';
    const req = { body: { code: 'eb4a4a58e5db31e5da759190e10510f690716554' } } as AccessTokenRequest;
    const authorizationCode = { scope, expirationTime: Infinity } as AuthorizationCode;
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const refreshToken = 'f5098b64734a88e6929912905d671cb7513e7233';

    const findAuthorizationCodeStub: AuthorizationCodeStorage['findAuthorizationCode'] = () => {
      return Promise.resolve(authorizationCode);
    };
    const issueAccessTokenStub: IssueAccessToken = () => {
      return Promise.resolve(accessToken);
    };
    const issueRefreshTokenStub: IssueRefreshToken = () => {
      return Promise.resolve(refreshToken);
    };
    const deleteAuthorizationCodeMock: AuthorizationCodeStorage['deleteAuthorizationCode'] = () => {
      t.ok(true);

      return Promise.resolve();
    };

    const authorizationCodeStorage = {
      findAuthorizationCode: findAuthorizationCodeStub,
      deleteAuthorizationCode: deleteAuthorizationCodeMock,
    } as AuthorizationCodeStorage;

    const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
      handleClientAuthentication: handleClientAuthenticationStub,
      authorizationCodeStorage,
      issueAccessToken: issueAccessTokenStub,
      issueRefreshToken: issueRefreshTokenStub,
    });

    const accessTokenResponse = await handleAuthorizationCodeGrant(req);

    t.match(accessTokenResponse, { accessToken, tokenType: 'Bearer', refreshToken, scope });
  });
});
