import { JsonWebKey } from 'crypto';

import { AuthorizationCodeStorage, ClientStorage, RefreshTokenStorage } from '../models';
import { exportJWK, makeJWT } from '../utils';
import { makeAssertAccessTokenScope } from './access-token-scope';
import { makeHandleClientAuthentication } from './client-authentication';
import { makeHandleAuthorizationRequest } from './authorization';
import { makeHandleAccessTokenRequest } from './access-token';
import { makeIssueAccessToken } from './issue-access-token';
import { makeIssueRefreshToken } from './issue-refresh-token';
import {
  makeHandleAuthorizationCodeGrant,
  makeHandleClientCredentialsGrant,
  makeHandleRefreshTokenGrant,
} from './grant-types';
import { makeHandleAuthorizationServerMetadataRequest } from './authorization-server-metadata';
import { makeHandleJWKSRequest } from './jwks';

export interface Storage extends AuthorizationCodeStorage, RefreshTokenStorage, ClientStorage {}

export const makeUseCases = ({
  storage,
  issuer,
  jwk,
  scopes,
}: {
  storage: Storage;
  issuer: string;
  jwk: JsonWebKey;
  scopes: string[];
}) => {
  const jwt = makeJWT({ jwk });

  const { assertAccessTokenScope } = makeAssertAccessTokenScope({ scopes });
  const { handleClientAuthentication } = makeHandleClientAuthentication({ clientStorage: storage });
  const { handleAuthorizationRequest } = makeHandleAuthorizationRequest({
    clientStorage: storage,
    authorizationCodeStorage: storage,
    assertAccessTokenScope,
  });
  const { issueAccessToken } = makeIssueAccessToken({ issuer, jwt });
  const { issueRefreshToken } = makeIssueRefreshToken({ refreshTokenStorage: storage });
  const { handleAuthorizationCodeGrant } = makeHandleAuthorizationCodeGrant({
    handleClientAuthentication,
    authorizationCodeStorage: storage,
    issueAccessToken,
    issueRefreshToken,
  });
  const { handleClientCredentialsGrant } = makeHandleClientCredentialsGrant({
    handleClientAuthentication,
    issueAccessToken,
    assertAccessTokenScope,
  });
  const { handleRefreshTokenGrant } = makeHandleRefreshTokenGrant({
    handleClientAuthentication,
    refreshTokenStorage: storage,
    issueAccessToken,
    issueRefreshToken,
  });
  const { handleAccessTokenRequest } = makeHandleAccessTokenRequest({
    handleClientAuthentication,
    handleAuthorizationCodeGrant,
    handleClientCredentialsGrant,
    handleRefreshTokenGrant,
  });
  const { handleAuthorizationServerMetadataRequest } = makeHandleAuthorizationServerMetadataRequest({ issuer, scopes });
  const { handleJWKSRequest } = makeHandleJWKSRequest({ jwk, exportJWK });

  return {
    handleAuthorizationRequest,
    handleAccessTokenRequest,
    handleAuthorizationServerMetadataRequest,
    handleJWKSRequest,
  };
};
