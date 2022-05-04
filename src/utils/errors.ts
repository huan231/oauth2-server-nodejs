import { ErrorRequestHandler } from 'express';

export class FallthroughError extends Error {}

export class OAuth2ServerError extends Error {
  constructor(readonly statusCode: number, readonly error: string, readonly errorDescription: string) {
    super(error);

    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidRequest extends OAuth2ServerError {
  constructor(errorDescription: string) {
    super(400, 'invalid_request', errorDescription);
  }
}

export class InvalidClient extends OAuth2ServerError {
  constructor(errorDescription: string) {
    super(401, 'invalid_client', errorDescription);
  }
}

export class AccessDenied extends OAuth2ServerError {
  constructor() {
    super(403, 'access_denied', 'the resource owner denied the request');
  }
}

export class InvalidScope extends OAuth2ServerError {
  constructor(scope: string) {
    super(400, 'invalid_scope', `the requested scope is invalid, unknown, or malformed "${scope}"`);
  }
}

export class InvalidGrant extends OAuth2ServerError {
  constructor(errorDescription: string) {
    super(400, 'invalid_grant', errorDescription);
  }
}

export class UnsupportedGrantType extends OAuth2ServerError {
  constructor(grantType: string) {
    super(
      400,
      'unsupported_grant_type',
      `the authorization grant type "${grantType}" is not supported by the authorization server`,
    );
  }
}

export class ServerError extends OAuth2ServerError {
  constructor() {
    super(
      500,
      'server_error',
      'the authorization server encountered an unexpected condition that prevented it from fulfilling the request',
    );
  }
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

export type ErrorHandler = ErrorRequestHandler<never, ErrorResponse, never, never, never>;

export const makeErrorHandler = ({ issuer }: { issuer: string }) => {
  const errorHandler: ErrorHandler = (err, req, res, next) => {
    if (res.headersSent || err instanceof FallthroughError) {
      return next(err);
    }

    const error = err instanceof OAuth2ServerError ? err : new ServerError();

    // If the client attempted to authenticate via the "Authorization"
    // request header field, the authorization server MUST
    // respond with an HTTP 401 (Unauthorized) status code and
    // include the "WWW-Authenticate" response header field
    // matching the authentication scheme used by the client.
    //
    // https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
    if (error.statusCode === 401 && req.header('authorization') !== undefined) {
      res.setHeader(
        'WWW-Authenticate',
        `Basic realm="${issuer}", error="${error.error}", error_description="${error.errorDescription}"`,
      );
    }

    res.status(error.statusCode).json({
      error: error.error,
      error_description: error.errorDescription,
    });

    next(err);
  };

  return { errorHandler };
};
