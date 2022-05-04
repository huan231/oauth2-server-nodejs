import { JsonWebKey } from 'crypto';

import t from 'tap';

import { ExportJWK } from '../../../src/utils';
import { makeHandleJWKSRequest } from '../../../src/use-cases/jwks';

t.test('jwks', (t) => {
  t.plan(1);

  const privateJWK: JsonWebKey = {
    kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
    crv: 'Ed25519',
    alg: 'EdDSA',
    use: 'sig',
    d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
    x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
    kty: 'OKP',
  };
  const publicJWK: JsonWebKey = {
    kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
    crv: 'Ed25519',
    alg: 'EdDSA',
    use: 'sig',
    x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
    kty: 'OKP',
  };

  const exportJWKStub: ExportJWK = () => {
    return publicJWK;
  };

  const { handleJWKSRequest } = makeHandleJWKSRequest({ jwk: privateJWK, exportJWK: exportJWKStub });

  const jwksResponse = handleJWKSRequest();

  t.same(jwksResponse, { keys: [publicJWK] });
});
