import { makeAuthorizationHandler, MakeHandleAuthentication, MakeHandleIsAuthorized } from './authorization';
import { makeTokenHandler } from './token';
import { HandleAuthorizationRequest } from '../use-cases/authorization';
import { HandleAccessTokenRequest } from '../use-cases/access-token';
import { HandleAuthorizationServerMetadataRequest } from '../use-cases/authorization-server-metadata';
import { makeAuthorizationServerMetadataHandler } from './authorization-server-metadata';

export const makeHandlers = ({
  handleAuthorizationRequest,
  handleAccessTokenRequest,
  makeHandleAuthentication,
  makeHandleIsAuthorized,
  handleAuthorizationServerMetadataRequest,
}: {
  handleAuthorizationRequest: HandleAuthorizationRequest;
  handleAccessTokenRequest: HandleAccessTokenRequest;
  makeHandleAuthentication: MakeHandleAuthentication;
  makeHandleIsAuthorized: MakeHandleIsAuthorized;
  handleAuthorizationServerMetadataRequest: HandleAuthorizationServerMetadataRequest;
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

  return { authorizationHandler, tokenHandler, authorizationServerMetadataHandler };
};
