import { epoch, InvalidGrant, InvalidRequest, seconds } from '../../utils';
import { AccessTokenRequest, AccessTokenResponse, BEARER_TOKEN_TYPE } from '../access-token';
import { HandleClientAuthentication } from '../client-authentication';
import { AuthorizationCodeStorage } from '../../models';
import { IssueAccessToken } from '../issue-access-token';
import { IssueRefreshToken } from '../issue-refresh-token';

const EXPIRES_IN = seconds('15m');

export type HandleAuthorizationCodeGrant = (req: AccessTokenRequest) => Promise<AccessTokenResponse>;

export const makeHandleAuthorizationCodeGrant = ({
  handleClientAuthentication,
  authorizationCodeStorage,
  issueAccessToken,
  issueRefreshToken,
}: {
  handleClientAuthentication: HandleClientAuthentication;
  authorizationCodeStorage: AuthorizationCodeStorage;
  issueAccessToken: IssueAccessToken;
  issueRefreshToken: IssueRefreshToken;
}) => {
  const handleAuthorizationCodeGrant: HandleAuthorizationCodeGrant = async (req) => {
    const client = await handleClientAuthentication(req);

    if (!req.body.code) {
      throw new InvalidRequest('the request is missing a required parameter "code"');
    }

    const authorizationCode = await authorizationCodeStorage.findAuthorizationCode(req.body.code, client.clientId);

    if (!authorizationCode) {
      throw new InvalidGrant('the provided authorization code is invalid, expired or revoked');
    }

    if (authorizationCode.expirationTime < epoch()) {
      await authorizationCodeStorage.deleteAuthorizationCode(req.body.code, client.clientId);

      throw new InvalidGrant('the provided authorization code is invalid, expired or revoked');
    }

    if (authorizationCode.redirectUri !== req.body.redirectUri) {
      throw new InvalidRequest('the request includes an invalid value for parameter "redirect_uri"');
    }

    const [accessToken, refreshToken] = await Promise.all([
      issueAccessToken({ ...authorizationCode, expiresIn: EXPIRES_IN }),
      issueRefreshToken({ ...authorizationCode }),
    ]);

    await authorizationCodeStorage.deleteAuthorizationCode(req.body.code, client.clientId);

    return {
      accessToken,
      tokenType: BEARER_TOKEN_TYPE,
      expiresIn: EXPIRES_IN,
      refreshToken,
      scope: authorizationCode.scope,
    };
  };

  return { handleAuthorizationCodeGrant };
};
