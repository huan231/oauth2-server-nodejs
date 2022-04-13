import t from 'tap';

import { makeHandleClientCredentialsGrant } from '../../../../src/use-cases/grant-types';
import { HandleClientAuthentication } from '../../../../src/use-cases/client-authentication';
import { IssueAccessToken } from '../../../../src/use-cases/issue-access-token';
import { AssertAccessTokenScope } from '../../../../src/use-cases/access-token-scope';
import { Client } from '../../../../src/models';
import { AccessTokenRequest } from '../../../../src/use-cases/access-token';

t.test('client credentials grant', async (t) => {
  t.plan(4);

  const client = { clientId: 's6BhdRkqt3' } as Client;
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  const scope = 'api:read api:write';
  const req = { body: { scope } } as AccessTokenRequest;

  const handleClientAuthenticationMock: HandleClientAuthentication = (req, methods) => {
    t.same(methods, ['client_secret_basic', 'client_secret_post']);

    return Promise.resolve(client);
  };
  const issueAccessTokenMock: IssueAccessToken = (params) => {
    t.match(params, { subject: client.clientId, scope });

    return Promise.resolve(accessToken);
  };
  const assertAccessTokenScopeMock: AssertAccessTokenScope = (scope) => {
    t.equal(scope, req.body.scope);
  };

  const { handleClientCredentialsGrant } = makeHandleClientCredentialsGrant({
    handleClientAuthentication: handleClientAuthenticationMock,
    issueAccessToken: issueAccessTokenMock,
    assertAccessTokenScope: assertAccessTokenScopeMock,
  });

  const accessTokenResponse = await handleClientCredentialsGrant(req);

  t.match(accessTokenResponse, { accessToken, tokenType: 'Bearer', scope });
});
