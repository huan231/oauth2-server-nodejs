import { epoch, InvalidGrant, InvalidRequest, InvalidScope, seconds } from '../../utils';
import { AccessTokenRequest, AccessTokenResponse, BEARER_TOKEN_TYPE } from '../access-token';
import { HandleClientAuthentication } from '../client-authentication';
import { RefreshToken, RefreshTokenStorage } from '../../models';
import { IssueAccessToken } from '../issue-access-token';
import { IssueRefreshToken } from '../issue-refresh-token';

const EXPIRES_IN = seconds('15m');

export type HandleRefreshTokenGrant = (req: AccessTokenRequest) => Promise<AccessTokenResponse>;

export const makeHandleRefreshTokenGrant = ({
  handleClientAuthentication,
  refreshTokenStorage,
  issueAccessToken,
  issueRefreshToken,
}: {
  handleClientAuthentication: HandleClientAuthentication;
  refreshTokenStorage: RefreshTokenStorage;
  issueAccessToken: IssueAccessToken;
  issueRefreshToken: IssueRefreshToken;
}) => {
  const assertAccessTokenScope = (refreshToken: RefreshToken, scope: string) => {
    const scopes = refreshToken.scope?.split(' ') ?? [];

    if (scope.split(' ').some((scope) => !scopes.includes(scope))) {
      throw new InvalidScope(scope);
    }
  };

  const handleRefreshTokenGrant: HandleRefreshTokenGrant = async (req) => {
    const client = await handleClientAuthentication(req);

    if (!req.body.refreshToken) {
      throw new InvalidRequest('the request is missing a required parameter "refresh_token"');
    }

    const refreshToken = await refreshTokenStorage.findRefreshToken(req.body.refreshToken, client.clientId);

    if (!refreshToken) {
      throw new InvalidGrant('the provided refresh token is invalid, expired or revoked');
    }

    if (refreshToken.expirationTime < epoch()) {
      await refreshTokenStorage.deleteRefreshToken(req.body.refreshToken, client.clientId);

      throw new InvalidGrant('the provided refresh token is invalid, expired or revoked');
    }

    if (req.body.scope) {
      assertAccessTokenScope(refreshToken, req.body.scope);
    }

    const scope = req.body.scope ?? refreshToken.scope;

    const [accessToken, newRefreshToken] = await Promise.all([
      issueAccessToken({ subject: refreshToken.subject, expiresIn: EXPIRES_IN, scope }),
      issueRefreshToken({ ...refreshToken, scope }),
    ]);

    await refreshTokenStorage.deleteRefreshToken(req.body.refreshToken, client.clientId);

    return { accessToken, tokenType: BEARER_TOKEN_TYPE, expiresIn: EXPIRES_IN, refreshToken: newRefreshToken, scope };
  };

  return { handleRefreshTokenGrant };
};
