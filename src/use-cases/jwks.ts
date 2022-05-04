import { JsonWebKey } from 'crypto';

import { ExportJWK } from '../utils';

export interface JWKSResponse {
  keys: JsonWebKey[];
}

export type HandleJWKSRequest = () => JWKSResponse;

export const makeHandleJWKSRequest = ({ jwk, exportJWK }: { jwk: JsonWebKey; exportJWK: ExportJWK }) => {
  const key = exportJWK(jwk);
  const jwksResponse: JWKSResponse = { keys: [key] };

  const handleJWKSRequest: HandleJWKSRequest = () => {
    return jwksResponse;
  };

  return { handleJWKSRequest };
};
