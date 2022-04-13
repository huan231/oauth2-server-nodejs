import t from 'tap';
import { Request, Response, NextFunction } from 'express';

import { corsMiddleware, corsPreflightMiddleware } from '../../../src/middlewares';
import { noop } from '../test-utils';

t.test('cors middleware', (t) => {
  t.plan(2);

  const headers: Record<string, Parameters<Response['setHeader']>[1]> = {};

  const setHeaderMock: Response['setHeader'] = (name, value) => {
    headers[name] = value;

    return res;
  };

  const req = {} as Request;
  const res = { setHeader: setHeaderMock } as Response;
  const next: NextFunction = () => {
    t.ok(true);
  };

  const cors = corsMiddleware();

  cors(req, res, next);

  t.same(headers, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization',
    'Access-Control-Expose-Headers': 'WWW-Authenticate',
  });
});

t.test('cors preflight middleware', (t) => {
  t.plan(4);

  const setHeaderMock: Response['setHeader'] = (name, value) => {
    t.equal(name, 'Access-Control-Allow-Methods');
    t.equal(value, 'GET,POST');

    return res;
  };
  const sendMock: Response['send'] = (body) => {
    t.type(body, 'undefined');

    return res;
  };
  const statusMock: Response['status'] = (code) => {
    t.equal(code, 204);

    return res;
  };

  const req = {} as Request;
  const res = { setHeader: setHeaderMock, status: statusMock, send: sendMock } as Response;

  const corsPreflight = corsPreflightMiddleware(['GET', 'POST']);

  corsPreflight(req, res, noop);
});
