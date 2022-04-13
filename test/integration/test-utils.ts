import express from 'express';

import { MemoryAdapter, oAuth2ServerMiddleware, OAuth2ServerMiddlewareOptions } from '../../src';

interface MakeAppOptions extends Pick<OAuth2ServerMiddlewareOptions, 'scopes'> {
  authenticate?: OAuth2ServerMiddlewareOptions['authenticate'];
  authorize?: OAuth2ServerMiddlewareOptions['authorize'];
  storage?: ConstructorParameters<typeof MemoryAdapter>[0];
}

export const makeApp = ({ storage, ...options }: MakeAppOptions = {}) => {
  const app = express();

  app.use(
    oAuth2ServerMiddleware({
      authenticate: () => () => Promise.reject('"authenticate" option is not implemented'),
      authorize: () => () => Promise.reject('"authorize" option is not implemented'),
      ...options,
      storage: new MemoryAdapter(storage),
      issuer: 'https://as.example.com',
      jwk: {
        kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
        crv: 'Ed25519',
        alg: 'EdDSA',
        use: 'sig',
        d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
        x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
        kty: 'OKP',
      },
    }),
  );

  return app;
};
