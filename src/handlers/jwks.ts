import { JsonWebKey } from 'crypto';

import { RequestHandler } from 'express';

import { HandleJWKSRequest } from '../use-cases/jwks';

type JWKSHandler = RequestHandler<never, { keys: JsonWebKey[] }, never, never, never>;

export const makeJWKSHandler = ({ handleJWKSRequest }: { handleJWKSRequest: HandleJWKSRequest }) => {
  const jwksHandler: JWKSHandler = (req, res) => {
    const jwksResponse = handleJWKSRequest();

    res.json(jwksResponse);
  };

  return { jwksHandler };
};
