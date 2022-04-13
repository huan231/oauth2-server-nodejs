import { HandleClientAuthentication } from './client-authentication';
import { InvalidRequest, UnsupportedGrantType } from '../utils';
import { HandleAuthorizationCodeGrant, HandleClientCredentialsGrant, HandleRefreshTokenGrant } from './grant-types';

export const BEARER_TOKEN_TYPE = 'Bearer';

export interface AccessTokenRequest {
  headers: { authorization?: string };
  body: {
    grantType?: string;
    code?: string;
    redirectUri?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    scope?: string;
  };
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
}

export type HandleAccessTokenRequest = (req: AccessTokenRequest) => Promise<AccessTokenResponse>;

export const makeHandleAccessTokenRequest = ({
  handleClientAuthentication,
  handleAuthorizationCodeGrant,
  handleClientCredentialsGrant,
  handleRefreshTokenGrant,
}: {
  handleClientAuthentication: HandleClientAuthentication;
  handleAuthorizationCodeGrant: HandleAuthorizationCodeGrant;
  handleClientCredentialsGrant: HandleClientCredentialsGrant;
  handleRefreshTokenGrant: HandleRefreshTokenGrant;
}) => {
  const handleUnsupportedGrantType = async (req: AccessTokenRequest) => {
    await handleClientAuthentication(req);

    switch (req.body.grantType) {
      case undefined:
        throw new InvalidRequest('the request is missing a required parameter "grant_type"');
      default:
        throw new UnsupportedGrantType(req.body.grantType);
    }
  };

  const handleAccessTokenRequest: HandleAccessTokenRequest = (req) => {
    switch (req.body.grantType) {
      case 'authorization_code':
        return handleAuthorizationCodeGrant(req);
      case 'client_credentials':
        return handleClientCredentialsGrant(req);
      case 'refresh_token':
        return handleRefreshTokenGrant(req);
      default:
        return handleUnsupportedGrantType(req);
    }
  };

  return { handleAccessTokenRequest };
};
