import t from 'tap';

import {
  AuthorizationRequest,
  HandleAuthentication,
  HandleIsAuthorized,
  makeHandleAuthorizationRequest,
  Unauthenticated,
} from '../../../src/use-cases/authorization';
import { AuthorizationCodeStorage, Client, ClientStorage } from '../../../src/models';
import { noop } from '../test-utils';
import { AssertAccessTokenScope } from '../../../src/use-cases/access-token-scope';

t.test('authorization', (t) => {
  t.plan(8);

  const clientId = 's6BhdRkqt3';
  const client = { clientId, redirectUris: [] } as Client;
  const req: AuthorizationRequest = { query: { clientId } };

  const clientStorage = {} as ClientStorage;
  const authorizationCodeStorage = {} as AuthorizationCodeStorage;

  t.test('missing a required parameter "client_id"', async (t) => {
    t.plan(1);

    const req: AuthorizationRequest = { query: {} };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    await t.rejects(() => handleAuthorizationRequest(req, noop, noop), { error: 'invalid_request' });
  });

  t.test('invalid value for parameter "client_id"', async (t) => {
    t.plan(1);

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(null);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    await t.rejects(() => handleAuthorizationRequest(req, noop, noop), { error: 'invalid_request' });
  });

  t.test('malformed value for parameter "redirect_uri"', async (t) => {
    t.plan(1);

    const req: AuthorizationRequest = { query: { clientId, redirectUri: 'client.example.org/callback' } };

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    await t.rejects(() => handleAuthorizationRequest(req, noop, noop), { error: 'invalid_request' });
  });

  t.test('invalid value for parameter "redirect_uri"', async (t) => {
    t.plan(1);

    const req: AuthorizationRequest = { query: { clientId, redirectUri: 'https://client.example.org/callback' } };
    const client = { clientId, redirectUris: ['https://client.example.org/callback2'] } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    await t.rejects(() => handleAuthorizationRequest(req, noop, noop), { error: 'invalid_request' });
  });

  t.test('missing a required parameter "redirect_uri"', async (t) => {
    t.plan(1);

    const client = {
      clientId,
      redirectUris: ['https://client.example.org/callback', 'https://client.example.org/callback2'],
    } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    await t.rejects(() => handleAuthorizationRequest(req, noop, noop), { error: 'invalid_request' });
  });

  t.test('missing a required parameter "response_type"', async (t) => {
    t.plan(1);

    const client = { clientId, redirectUris: ['https://client.example.org/callback'] } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    const url = await handleAuthorizationRequest(req, noop, noop);

    const { searchParams } = new URL(url);

    t.equal(searchParams.get('error'), 'invalid_request');
  });

  t.test('unsupported response type', async (t) => {
    t.plan(1);

    const req: AuthorizationRequest = { query: { clientId, responseType: 'token' } };
    const client = { clientId, redirectUris: ['https://client.example.org/callback'] } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
      clientStorage,
      authorizationCodeStorage,
      assertAccessTokenScope: noop,
    });

    const url = await handleAuthorizationRequest(req, noop, noop);

    const { searchParams } = new URL(url);

    t.equal(searchParams.get('error'), 'unsupported_response_type');
  });

  t.test('authorization code', (t) => {
    t.plan(8);

    const responseType = 'code';
    const client = { clientId, redirectUris: ['https://client.example.org/callback'] } as Client;
    const req: AuthorizationRequest = { query: { clientId, responseType } };

    const addAuthorizationCodeStub: AuthorizationCodeStorage['addAuthorizationCode'] = () => {
      return Promise.resolve();
    };
    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };
    const handleIsAuthorizedStub: HandleIsAuthorized = () => {
      return Promise.resolve(true);
    };

    const authorizationCodeStorage = { addAuthorizationCode: addAuthorizationCodeStub } as AuthorizationCodeStorage;
    const clientStorage: ClientStorage = { findClient: findClientStub };

    t.test('invalid value for parameter "state"', async (t) => {
      t.plan(1);

      const state = '😂😂😂😂😂😂😂😂😂😂😂😂😂';

      const req: AuthorizationRequest = { query: { clientId, responseType, state } };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      const url = await handleAuthorizationRequest(req, noop, noop);

      const { searchParams } = new URL(url);

      t.equal(searchParams.get('error'), 'invalid_request');
    });

    t.test('asserts access token scope', async (t) => {
      t.plan(1);

      const scope = 'api:read api:write';

      const req: AuthorizationRequest = { query: { clientId, responseType, scope } };

      const assertAccessTokenScopeMock: AssertAccessTokenScope = () => {
        t.ok(true);
      };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: assertAccessTokenScopeMock,
      });

      await handleAuthorizationRequest(req, noop, noop);
    });

    t.test('access denied', async (t) => {
      t.plan(1);

      const handleIsAuthorizedStub: HandleIsAuthorized = () => {
        return Promise.resolve(false);
      };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      const url = await handleAuthorizationRequest(req, noop, handleIsAuthorizedStub);

      const { searchParams } = new URL(url);

      t.equal(searchParams.get('error'), 'access_denied');
    });

    t.test('interaction error', async (t) => {
      t.plan(1);

      const err = new Unauthenticated(client, req);

      const handleAuthenticationStub: HandleAuthentication = () => {
        throw err;
      };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      await t.rejects(() => handleAuthorizationRequest(req, handleAuthenticationStub, noop), err);
    });

    t.test('unexpected error', async (t) => {
      t.plan(1);

      const handleAuthenticationStub: HandleAuthentication = () => {
        throw new Error();
      };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      const url = await handleAuthorizationRequest(req, handleAuthenticationStub, noop);

      const { searchParams } = new URL(url);

      t.equal(searchParams.get('error'), 'server_error');
    });

    t.test('error response contains "state" parameter', async (t) => {
      t.plan(1);

      const state = 'cf136dc3c1fc93f31185e5885805d';

      const req: AuthorizationRequest = { query: { clientId, responseType, state } };

      const handleAuthenticationStub: HandleAuthentication = () => {
        throw new Error();
      };

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      const url = await handleAuthorizationRequest(req, handleAuthenticationStub, noop);

      const { searchParams } = new URL(url);

      t.equal(searchParams.get('state'), state);
    });

    t.test('authorization response contains "code" parameter', async (t) => {
      t.plan(1);

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      const url = await handleAuthorizationRequest(req, noop, handleIsAuthorizedStub);

      const { searchParams } = new URL(url);

      t.type(searchParams.get('code'), 'string');
    });

    t.test('authorization code added with "redirect_uri" from request', async (t) => {
      t.plan(1);

      const addAuthorizationCodeMock: AuthorizationCodeStorage['addAuthorizationCode'] = (authorizationCode) => {
        t.match(authorizationCode, { redirectUri: undefined });

        return Promise.resolve();
      };

      const authorizationCodeStorage = { addAuthorizationCode: addAuthorizationCodeMock } as AuthorizationCodeStorage;

      const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
        clientStorage,
        authorizationCodeStorage,
        assertAccessTokenScope: noop,
      });

      await handleAuthorizationRequest(req, noop, handleIsAuthorizedStub);
    });
  });
});
