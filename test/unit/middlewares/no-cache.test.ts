import t from 'tap';
import { Request, Response, NextFunction } from 'express';

import { noCacheMiddleware } from '../../../src/middlewares';

t.test('no cache middleware', (t) => {
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

  const noCache = noCacheMiddleware();

  noCache(req, res, next);

  t.same(headers, { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' });
});
