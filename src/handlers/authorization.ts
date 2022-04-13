import { RequestHandler, Response } from 'express';

import {
  HandleAuthorizationRequest,
  AuthorizationRequest,
  HandleAuthentication,
  HandleIsAuthorized,
} from '../use-cases/authorization';

type AuthorizationHandler = RequestHandler<
  never,
  never,
  never,
  { response_type?: unknown; client_id?: unknown; redirect_uri?: unknown; scope?: unknown; state?: unknown },
  never
>;

const makeAuthorizationRequest = (req: Parameters<AuthorizationHandler>[0]): AuthorizationRequest => ({
  query: {
    responseType: typeof req.query.response_type === 'string' ? req.query.response_type : undefined,
    clientId: typeof req.query.client_id === 'string' ? req.query.client_id : undefined,
    redirectUri: typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : undefined,
    scope: typeof req.query.scope === 'string' ? req.query.scope : undefined,
    state: typeof req.query.state === 'string' ? req.query.state : undefined,
  },
});

export type MakeHandleAuthentication = (
  req: Parameters<AuthorizationHandler>[0],
  res: Response<never, never>,
) => HandleAuthentication;
export type MakeHandleIsAuthorized = (
  req: Parameters<AuthorizationHandler>[0],
  res: Response<never, never>,
) => HandleIsAuthorized;

export const makeAuthorizationHandler = ({
  handleAuthorizationRequest,
  makeHandleAuthentication,
  makeHandleIsAuthorized,
}: {
  handleAuthorizationRequest: HandleAuthorizationRequest;
  makeHandleAuthentication: MakeHandleAuthentication;
  makeHandleIsAuthorized: MakeHandleIsAuthorized;
}) => {
  const authorizationHandler: AuthorizationHandler = async (req, res, next) => {
    try {
      const authorizationRequest = makeAuthorizationRequest(req);

      const handleAuthentication = makeHandleAuthentication(req, res);
      const handleIsAuthorized = makeHandleIsAuthorized(req, res);

      const url = await handleAuthorizationRequest(authorizationRequest, handleAuthentication, handleIsAuthorized);

      res.redirect(url);
    } catch (err) {
      next(err);
    }
  };

  return { authorizationHandler };
};
