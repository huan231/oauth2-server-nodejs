import { JsonWebKey } from 'crypto';

import { Router, urlencoded } from 'express';

import { makeHandlers } from './handlers';
import { makeUseCases, Storage } from './use-cases';
import { makeErrorHandler } from './utils';
import { MakeHandleAuthentication, MakeHandleIsAuthorized } from './handlers/authorization';
import { corsMiddleware, corsPreflightMiddleware, noCacheMiddleware } from './middlewares';

export interface OAuth2ServerMiddlewareOptions {
  /**
   * Authenticates the resource owner.
   *
   * ```ts
   * import { OAuth2ServerMiddlewareOptions, Unauthenticated } from 'oauth2-server-nodejs';
   *
   * const authenticate: OAuth2ServerMiddlewareOptions['authenticate'] = (req, res) => (client, authorizationRequest) => {
   *   const subject = '';
   *
   *   if (!subject) {
   *     // The resource owner is not authenticated.
   *     throw new Unauthenticated(client, authorizationRequest);
   *   }
   *
   *   // Locally unique and never reassigned identifier within the issuer for the resource owner.
   *   return Promise.resolve(subject);
   * };
   * ```
   */
  authenticate: MakeHandleAuthentication;
  /**
   * Establishes whether the resource owner grants or denies the client's access request.
   *
   * ```ts
   * import { OAuth2ServerMiddlewareOptions, UnresolvedAuthorization } from 'oauth2-server-nodejs';
   *
   * const authorize: OAuth2ServerMiddlewareOptions['authorize'] = (req, res) => (client, authorizationRequest) => {
   *   const isAuthorized = false;
   *
   *   if (isAuthorized === null) {
   *     // The authorization server can't establish whether the resource owner grants or denies the client's access request.
   *     throw new UnresolvedAuthorization(client, authorizationRequest);
   *   }
   *
   *   // Information whether the resource owner grants or denies the client's access request.
   *   return Promise.resolve(isAuthorized);
   * };
   * ```
   */
  authorize: MakeHandleIsAuthorized;
  storage: Storage;
  /**
   * Authorization server's issuer identifier URL.
   */
  issuer: string;
  /**
   * JSON Web Key [RFC7517](https://datatracker.ietf.org/doc/html/rfc7517) document representing the authorization server's private key.
   */
  jwk: JsonWebKey;
  /**
   * JSON array containing a list of the OAuth 2.0 "scope" values that this authorization server supports.
   */
  scopes?: string[];
}

export const oAuth2ServerMiddleware = ({
  authenticate,
  authorize,
  storage,
  issuer,
  jwk,
  scopes = [],
}: OAuth2ServerMiddlewareOptions) => {
  const router = Router();

  router.use(urlencoded({ extended: false }));

  const { handleAuthorizationRequest, handleAccessTokenRequest, handleAuthorizationServerMetadataRequest } =
    makeUseCases({ storage, issuer, jwk, scopes });
  const { authorizationHandler, tokenHandler, authorizationServerMetadataHandler } = makeHandlers({
    handleAuthorizationRequest,
    handleAccessTokenRequest,
    makeHandleAuthentication: authenticate,
    makeHandleIsAuthorized: authorize,
    handleAuthorizationServerMetadataRequest,
  });
  const { errorHandler } = makeErrorHandler({ issuer });

  router.get('/authorize', authorizationHandler);

  router.options('/token', corsMiddleware(), corsPreflightMiddleware(['POST']));
  router.post('/token', corsMiddleware(), noCacheMiddleware(), tokenHandler);

  router.options('/.well-known/oauth-authorization-server', corsMiddleware(), corsPreflightMiddleware(['GET']));
  router.get('/.well-known/oauth-authorization-server', corsMiddleware(), authorizationServerMetadataHandler);

  router.use(errorHandler);

  return router;
};

export * from './adapters';
export { Unauthenticated, UnresolvedAuthorization } from './use-cases/authorization';
