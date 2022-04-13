import { seconds } from '../../utils';
import { AccessTokenRequest, AccessTokenResponse, BEARER_TOKEN_TYPE } from '../access-token';
import { HandleClientAuthentication } from '../client-authentication';
import { AssertAccessTokenScope } from '../access-token-scope';
import { IssueAccessToken } from '../issue-access-token';

const EXPIRES_IN = seconds('1h');

export type HandleClientCredentialsGrant = (req: AccessTokenRequest) => Promise<AccessTokenResponse>;

export const makeHandleClientCredentialsGrant = ({
  handleClientAuthentication,
  issueAccessToken,
  assertAccessTokenScope,
}: {
  handleClientAuthentication: HandleClientAuthentication;
  issueAccessToken: IssueAccessToken;
  assertAccessTokenScope: AssertAccessTokenScope;
}) => {
  const handleClientCredentialsGrant: HandleClientCredentialsGrant = async (req) => {
    const client = await handleClientAuthentication(req, ['client_secret_basic', 'client_secret_post']);

    if (req.body.scope) {
      assertAccessTokenScope(req.body.scope);
    }

    const accessToken = await issueAccessToken({
      subject: client.clientId,
      expiresIn: EXPIRES_IN,
      scope: req.body.scope,
    });

    return { accessToken, tokenType: BEARER_TOKEN_TYPE, expiresIn: EXPIRES_IN, scope: req.body.scope };
  };

  return { handleClientCredentialsGrant };
};
