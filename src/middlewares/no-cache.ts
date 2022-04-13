import { RequestHandler } from 'express';

export const noCacheMiddleware = (): RequestHandler => (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  next();
};
