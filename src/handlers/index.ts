import { makeAuthorizationHandler, MakeHandleAuthentication, MakeHandleIsAuthorized } from './authorization';
import { makeTokenHandler } from './token';
import { HandleAuthorizationRequest } from '../use-cases/authorization';
import { HandleAccessTokenRequest } from '../use-cases/access-token';

export const makeHandlers = ({
  handleAuthorizationRequest,
  handleAccessTokenRequest,
  makeHandleAuthentication,
  makeHandleIsAuthorized,
}: {
  handleAuthorizationRequest: HandleAuthorizationRequest;
  handleAccessTokenRequest: HandleAccessTokenRequest;
  makeHandleAuthentication: MakeHandleAuthentication;
  makeHandleIsAuthorized: MakeHandleIsAuthorized;
}) => {
  const { authorizationHandler } = makeAuthorizationHandler({
    handleAuthorizationRequest,
    makeHandleAuthentication,
    makeHandleIsAuthorized,
  });
  const { tokenHandler } = makeTokenHandler({ handleAccessTokenRequest });

  return { authorizationHandler, tokenHandler };
};
