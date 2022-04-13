import { RequestHandler } from 'express';

type RequestMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const corsPreflightMiddleware =
  (methods: RequestMethod[]): RequestHandler =>
  (req, res) => {
    res.setHeader('Access-Control-Allow-Methods', methods.join(','));

    res.status(204).send();
  };

export const corsMiddleware = (): RequestHandler => (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate');

  next();
};
