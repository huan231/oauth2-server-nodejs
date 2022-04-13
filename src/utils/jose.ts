import { JsonWebKey, KeyObject } from 'crypto';
import { TextEncoder, promisify } from 'util';

import { base64url } from './buffer';

const { createPrivateKey, sign: signSync } = await import('crypto');

const sign = promisify(signSync);

type Algorithm = 'EdDSA' | 'RS256';

const encoder = new TextEncoder();

const digest = (algorithm: Algorithm) => {
  switch (algorithm) {
    case 'RS256':
      return 'sha256';
    case 'EdDSA':
      return undefined;
  }
};

interface JWSProtectedHeader {
  alg: Algorithm;
  [K: string]: unknown;
}

interface JWSPayload {
  [K: string]: unknown;
}

interface JWS {
  sign: (protectedHeader: JWSProtectedHeader, payload: JWSPayload, key: KeyObject) => Promise<string>;
}

const jws: JWS = {
  sign: async (protectedHeader, payload, key) => {
    const compactProtectedHeader = base64url(JSON.stringify(protectedHeader));
    const compactPayload = base64url(JSON.stringify(payload));

    const data = encoder.encode(`${compactProtectedHeader}.${compactPayload}`);

    const signature = await sign(digest(protectedHeader.alg), data, key);

    const compactSignature = signature.toString('base64url');

    return `${compactProtectedHeader}.${compactPayload}.${compactSignature}`;
  },
};

interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
  [K: string]: unknown;
}

export interface JWT {
  sign: (payload: JWTPayload) => Promise<string>;
}

export const makeJWT = ({ jwk }: { jwk: JsonWebKey }): JWT => {
  switch (jwk.alg) {
    case 'RS256':
    case 'EdDSA':
      break;
    case undefined:
      throw new Error('missing JWK "alg" (algorithm) parameter');
    default:
      throw new Error(`invalid JWK "alg" (algorithm) parameter "${jwk.alg}"`);
  }

  if (typeof jwk.kid !== 'string') {
    throw new Error('missing or invalid JWK "kid" (Key ID) parameter');
  }

  const key = createPrivateKey({ key: jwk, format: 'jwk' });

  const algorithm = jwk.alg;

  const sign: JWT['sign'] = (payload) => {
    return jws.sign({ kid: jwk.kid, typ: 'JWT', alg: algorithm }, payload, key);
  };

  return { sign };
};
