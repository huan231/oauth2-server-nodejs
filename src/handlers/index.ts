import { makeAuthorizationHandler, MakeHandleAuthentication, MakeHandleIsAuthorized } from './authorization';
import { makeTokenHandler } from './token';
import { HandleAuthorizationRequest } from '../use-cases/authorization';
import { HandleAccessTokenRequest } from '../use-cases/access-token';
import { HandleAuthorizationServerMetadataRequest } from '../use-cases/authorization-server-metadata';
import { makeAuthorizationServerMetadataHandler } from './authorization-server-metadata';
import { HandleJWKSRequest } from '../use-cases/jwks';
import { makeJWKSHandler } from './jwks';

export const makeHandlers = ({
  handleAuthorizationRequest,
  handleAccessTokenRequest,
  makeHandleAuthentication,
  makeHandleIsAuthorized,
  handleAuthorizationServerMetadataRequest,
  handleJWKSRequest,
}: {
  handleAuthorizationRequest: HandleAuthorizationRequest;
  handleAccessTokenRequest: HandleAccessTokenRequest;
  makeHandleAuthentication: MakeHandleAuthentication;
  makeHandleIsAuthorized: MakeHandleIsAuthorized;
  handleAuthorizationServerMetadataRequest: HandleAuthorizationServerMetadataRequest;
  handleJWKSRequest: HandleJWKSRequest;
}) => {
  const { authorizationHandler } = makeAuthorizationHandler({
    handleAuthorizationRequest,
    makeHandleAuthentication,
    makeHandleIsAuthorized,
  });
  const { tokenHandler } = makeTokenHandler({ handleAccessTokenRequest });
  const { authorizationServerMetadataHandler } = makeAuthorizationServerMetadataHandler({
    handleAuthorizationServerMetadataRequest,
  });
  const { jwksHandler } = makeJWKSHandler({ handleJWKSRequest });

  return { authorizationHandler, tokenHandler, authorizationServerMetadataHandler, jwksHandler };
};
