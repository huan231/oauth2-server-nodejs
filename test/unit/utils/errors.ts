import t from 'tap';
import { NextFunction } from 'express';

import { makeErrorHandler, ErrorHandler, FallthroughError, OAuth2ServerError } from '../../../src/utils';
import { noop } from '../test-utils';

type ErrorRequest = Parameters<ErrorHandler>[1];
type ErrorResponse = Parameters<ErrorHandler>[2];

t.test('errors', (t) => {
  t.plan(1);

  t.test('error handler', (t) => {
    t.plan(5);

    const issuer = 'https://as.example.com';

    t.test('headers already sent', (t) => {
      t.plan(1);

      const err = new Error();

      const statusMock: ErrorResponse['status'] = () => {
        t.ok(true);

        return res;
      };

      const req = {} as ErrorRequest;
      const res = { headersSent: true, status: statusMock } as ErrorResponse;
      const next: NextFunction = (error) => {
        t.equal(error, err);
      };

      const { errorHandler } = makeErrorHandler({ issuer });

      errorHandler(err, req, res, next);
    });

    t.test('fallthrough error', (t) => {
      t.plan(1);

      const err = new FallthroughError();

      const statusMock: ErrorResponse['status'] = () => {
        t.ok(true);

        return res;
      };

      const req = {} as ErrorRequest;
      const res = { status: statusMock } as ErrorResponse;
      const next: NextFunction = (error) => {
        t.equal(error, err);
      };

      const { errorHandler } = makeErrorHandler({ issuer });

      errorHandler(err, req, res, next);
    });

    t.test('oauth2 server error', (t) => {
      t.plan(3);

      const statusCode = 400;
      const error = 'error';
      const errorDescription = 'error description';

      const err = new OAuth2ServerError(statusCode, error, errorDescription);

      const statusMock: ErrorResponse['status'] = (code) => {
        t.equal(code, statusCode);

        return res;
      };

      const jsonMock: ErrorResponse['json'] = (body) => {
        t.same(body, { error, error_description: errorDescription });

        return res;
      };

      const req = {} as ErrorRequest;
      const res = { status: statusMock, json: jsonMock } as ErrorResponse;
      const next: NextFunction = (error) => {
        t.equal(error, err);
      };

      const { errorHandler } = makeErrorHandler({ issuer });

      errorHandler(err, req, res, next);
    });

    t.test('unknown error', (t) => {
      t.plan(3);

      const err = new Error();

      const statusMock: ErrorResponse['status'] = (code) => {
        t.equal(code, 500);

        return res;
      };

      const jsonMock: ErrorResponse['json'] = (body) => {
        t.same(body, {
          error: 'server_error',
          error_description:
            'the authorization server encountered an unexpected condition that prevented it from fulfilling the request',
        });

        return res;
      };

      const req = {} as ErrorRequest;
      const res = { status: statusMock, json: jsonMock } as ErrorResponse;
      const next: NextFunction = (error) => {
        t.equal(error, err);
      };

      const { errorHandler } = makeErrorHandler({ issuer });

      errorHandler(err, req, res, next);
    });

    t.test('unauthorized', (t) => {
      t.plan(2);

      const error = 'error';
      const errorDescription = 'error description';
      const err = new OAuth2ServerError(401, error, errorDescription);

      const statusStub: ErrorResponse['status'] = () => {
        return res;
      };
      const jsonStub: ErrorResponse['json'] = () => {
        return res;
      };
      const headerStub = (() => {
        return 'Basic czZCaGRSa3F0MzpjZjEzNmRjM2MxZmM5M2YzMTE4NWU1ODg1ODA1ZA==';
      }) as unknown as ErrorRequest['header'];

      const setHeaderMock: ErrorResponse['setHeader'] = (name, value) => {
        t.equal(name, 'WWW-Authenticate');
        t.equal(value, `Basic realm="${issuer}", error="${error}", error_description="${errorDescription}"`);

        return res;
      };

      const req = { header: headerStub } as ErrorRequest;
      const res = { status: statusStub, json: jsonStub, setHeader: setHeaderMock } as ErrorResponse;

      const { errorHandler } = makeErrorHandler({ issuer });

      errorHandler(err, req, res, noop);
    });
  });
});
