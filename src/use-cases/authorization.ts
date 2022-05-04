import { randomBytes } from 'crypto';

import { AuthorizationCodeStorage, Client, ClientStorage } from '../models';
import {
  AccessDenied,
  epoch,
  FallthroughError,
  InvalidRequest,
  OAuth2ServerError,
  seconds,
  ServerError,
} from '../utils';
import { AssertAccessTokenScope } from './access-token-scope';

export interface AuthorizationRequest {
  query: {
    responseType?: string;
    clientId?: string;
    redirectUri?: string;
    scope?: string;
    state?: string;
  };
}

class InteractionError extends FallthroughError {
  constructor(readonly client: Client, readonly req: AuthorizationRequest) {
    super();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * The resource owner is not authenticated, additional interaction is required.
 */
export class Unauthenticated extends InteractionError {}

/**
 * The authorization server can't establish whether the resource owner grants or denies the client's access request, additional interaction is required.
 */
export class UnresolvedAuthorization extends InteractionError {}

/**
 * The authorization server authenticates the resource owner.
 *
 * @throws {Unauthenticated}
 */
export type HandleAuthentication = (client: Client, req: AuthorizationRequest) => Promise<string>;
/**
 * The authorization server establishes whether the resource owner grants or denies the client's access request.
 *
 * @throws {UnresolvedAuthorization}
 */
export type HandleIsAuthorized = (client: Client, req: AuthorizationRequest, subject: string) => Promise<boolean>;

export type HandleAuthorizationRequest = (
  req: AuthorizationRequest,
  handleAuthentication: HandleAuthentication,
  handleIsAuthorized: HandleIsAuthorized,
) => Promise<string>;

const STATE_CHARACTERS_REGEX = /^[\x20-\x7e]+$/;
const EXPIRES_IN = seconds('1m');

export const makeHandleAuthorizationRequest = ({
  clientStorage,
  authorizationCodeStorage,
  assertAccessTokenScope,
}: {
  clientStorage: ClientStorage;
  authorizationCodeStorage: AuthorizationCodeStorage;
  assertAccessTokenScope: AssertAccessTokenScope;
}) => {
  const handleClientAuthentication = async (req: AuthorizationRequest) => {
    if (!req.query.clientId) {
      throw new InvalidRequest('the request is missing a required parameter "client_id"');
    }

    const client = await clientStorage.findClient(req.query.clientId);

    if (!client) {
      throw new InvalidRequest('the request includes an invalid value for parameter "client_id"');
    }

    return client;
  };

  const handleRedirectUri = async (redirectUris: Client['redirectUris'], req: AuthorizationRequest) => {
    if (req.query.redirectUri) {
      try {
        new URL(req.query.redirectUri);
      } catch {
        throw new InvalidRequest('the request includes an invalid value for parameter "redirect_uri"');
      }

      if (!redirectUris.includes(req.query.redirectUri)) {
        throw new InvalidRequest('the request includes an invalid value for parameter "redirect_uri"');
      }
    }

    // If multiple redirection URIs have been registered, [...] or if no redirection URI has
    // been registered, the client MUST include a redirection URI with the
    // authorization request using the "redirect_uri" request parameter.
    //
    // https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2.3
    const redirectUri = req.query.redirectUri ?? (redirectUris.length === 1 ? redirectUris[0] : undefined);

    if (!redirectUri) {
      throw new InvalidRequest('the request is missing a required parameter "redirect_uri"');
    }

    return new URL(redirectUri);
  };

  const handleCodeResponseType = async (
    req: AuthorizationRequest,
    handleAuthentication: HandleAuthentication,
    handleIsAuthorized: HandleIsAuthorized,
  ) => {
    const client = await handleClientAuthentication(req);
    const url = await handleRedirectUri(client.redirectUris, req);

    try {
      if (req.query.state) {
        if (!STATE_CHARACTERS_REGEX.test(req.query.state)) {
          throw new InvalidRequest('the request includes an invalid value for parameter "state"');
        }

        url.searchParams.set('state', req.query.state);
      }

      if (req.query.scope) {
        assertAccessTokenScope(req.query.scope);
      }

      const subject = await handleAuthentication(client, req);
      const isAuthorized = await handleIsAuthorized(client, req, subject);

      if (!isAuthorized) {
        throw new AccessDenied();
      }

      const code = randomBytes(20).toString('hex');

      await authorizationCodeStorage.addAuthorizationCode({
        code,
        subject,
        clientId: client.clientId,
        redirectUri: req.query.redirectUri,
        scope: req.query.scope,
        expirationTime: epoch() + EXPIRES_IN,
      });

      url.searchParams.set('code', code);
    } catch (err) {
      if (err instanceof InteractionError) {
        throw err;
      }

      const error = err instanceof OAuth2ServerError ? err : new ServerError();

      url.searchParams.set('error', error.error);
      url.searchParams.set('error_description', error.errorDescription);
    }

    return url.href;
  };

  const handleUnsupportedResponseType = async (req: AuthorizationRequest) => {
    const client = await handleClientAuthentication(req);
    const url = await handleRedirectUri(client.redirectUris, req);

    switch (req.query.responseType) {
      case undefined:
        url.searchParams.set('error', 'invalid_request');
        url.searchParams.set('error_description', 'the request is missing a required parameter "response_type"');
        break;
      default:
        url.searchParams.set('error', 'unsupported_response_type');
        url.searchParams.set(
          'error_description',
          `the authorization server does not support response type "${req.query.responseType}"`,
        );
    }

    return url.href;
  };

  const handleAuthorizationRequest: HandleAuthorizationRequest = (req, handleAuthentication, handleIsAuthorized) => {
    switch (req.query.responseType) {
      case 'code':
        return handleCodeResponseType(req, handleAuthentication, handleIsAuthorized);
      default:
        return handleUnsupportedResponseType(req);
    }
  };

  return { handleAuthorizationRequest };
};
