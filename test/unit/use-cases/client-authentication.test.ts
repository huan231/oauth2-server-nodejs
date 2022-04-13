import t from 'tap';

import {
  ClientAuthenticationRequest,
  makeHandleClientAuthentication,
} from '../../../src/use-cases/client-authentication';
import { Client, ClientStorage } from '../../../src/models';

t.test('client authentication', (t) => {
  t.plan(8);

  const clientId = 's6BhdRkqt3';
  const clientSecret = 'cf136dc3c1fc93f31185e5885805d';

  const client = { clientId, clientSecret } as Client;

  const findClientStub: ClientStorage['findClient'] = () => {
    return Promise.resolve(client);
  };

  const clientStorage: ClientStorage = { findClient: findClientStub };

  t.test('client_secret_basic', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = {
      headers: { authorization: 'Basic czZCaGRSa3F0MzpjZjEzNmRjM2MxZmM5M2YzMTE4NWU1ODg1ODA1ZA==' },
      body: {},
    };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.resolveMatch(() => handleClientAuthentication(req, ['client_secret_basic']), client);
  });

  t.test('client_secret_basic with reserved characters', async (t) => {
    t.plan(1);

    const clientSecret = 'cf136dc3c1fc93f31185e5885##805d';
    const client = { clientId, clientSecret } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const req: ClientAuthenticationRequest = {
      headers: { authorization: 'Basic czZCaGRSa3F0MzpjZjEzNmRjM2MxZmM5M2YzMTE4NWU1ODg1JTIzJTIzODA1ZA==' },
      body: {},
    };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.resolveMatch(() => handleClientAuthentication(req, ['client_secret_basic']), client);
  });

  t.test('client_secret_post', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = { headers: {}, body: { clientId, clientSecret } };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.resolveMatch(() => handleClientAuthentication(req, ['client_secret_post']), client);
  });

  t.test('none', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = { headers: {}, body: { clientId } };
    const client = { clientId } as Client;

    const findClientStub: ClientStorage['findClient'] = () => {
      return Promise.resolve(client);
    };

    const clientStorage: ClientStorage = { findClient: findClientStub };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.resolveMatch(() => handleClientAuthentication(req, ['none']), client);
  });

  t.test('missing credentials', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = { headers: {}, body: {} };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.rejects(() => handleClientAuthentication(req), { error: 'invalid_client' });
  });

  t.test('multiple credentials', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = {
      headers: { authorization: 'Basic czZCaGRSa3F0MzpjZjEzNmRjM2MxZmM5M2YzMTE4NWU1ODg1ODA1ZA==' },
      body: { clientId, clientSecret },
    };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.rejects(() => handleClientAuthentication(req), { error: 'invalid_request' });
  });

  t.test('invalid credentials', async (t) => {
    t.plan(1);

    const clientSecret = 'f5098b64734a88e6929912905d671cb7513e7233';
    const req: ClientAuthenticationRequest = { headers: {}, body: { clientId, clientSecret } };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.rejects(() => handleClientAuthentication(req), { error: 'invalid_client' });
  });

  t.test('client_secret_post takes precedence over none', async (t) => {
    t.plan(1);

    const req: ClientAuthenticationRequest = { headers: {}, body: { clientId, clientSecret } };

    const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage });

    await t.resolveMatch(() => handleClientAuthentication(req, ['none', 'client_secret_post']), client);
  });
});
