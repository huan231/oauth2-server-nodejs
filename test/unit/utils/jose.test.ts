import { JsonWebKey } from 'crypto';

import t from 'tap';

import { exportJWK, makeJWT } from '../../../src/utils';

t.test('javascript object signing and encryption', (t) => {
  t.plan(6);

  t.test('missing JWK "alg" (algorithm) parameter', (t) => {
    t.plan(1);

    const jwk: JsonWebKey = {
      crv: 'Ed25519',
      use: 'sig',
      d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
      x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
      kty: 'OKP',
    };

    t.throws(() => makeJWT({ jwk }), { message: 'missing JWK "alg" (algorithm) parameter' });
  });

  t.test('invalid JWK "alg" (algorithm) parameter', (t) => {
    t.plan(1);

    const jwk: JsonWebKey = {
      kty: 'oct',
      kid: '0afee142-a0af-4410-abcc-9f2d44ff45b5',
      alg: 'HS256',
      k: 'FdFYFzERwC2uCBB46pZQi4GG85LujR8obt-KWRBICVQ',
    };

    t.throws(() => makeJWT({ jwk }), { message: `invalid JWK "alg" (algorithm) parameter "${jwk.alg}"` });
  });

  t.test('missing or invalid JWK "kid" (Key ID) parameter', (t) => {
    t.plan(1);

    const jwk: JsonWebKey = {
      crv: 'Ed25519',
      alg: 'EdDSA',
      use: 'sig',
      d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
      x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
      kty: 'OKP',
    };

    t.throws(() => makeJWT({ jwk }), { message: 'missing or invalid JWK "kid" (Key ID) parameter' });
  });

  t.test('public key', (t) => {
    t.plan(1);

    const jwk: JsonWebKey = {
      kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
      alg: 'EdDSA',
      use: 'sig',
      x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
      kty: 'OKP',
    };

    t.throws(() => makeJWT({ jwk }));
  });

  t.test('sign jwt', (t) => {
    t.plan(2);

    const payload = {
      iss: 'https://as.example.com',
      sub: '5a72e6cc-6f51-488f-95cf-93c0af96ccf0',
      example: 'example',
    };

    t.test('RS256', async (t) => {
      t.plan(1);

      const jwk: JsonWebKey = {
        kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
        e: 'AQAB',
        n: 'rPOe2kdmQY1wN2ADn-EIKsPO_kXotIqPjbZQOoW6sIHPGS8xJqrR60JLTBir5jG8Prrp4_KoEDGm3zYlWb5EJr9BMAVHAUYB2ZMXjdojpIkKeJ_cMI0lLcSUTkKkOA6u2DnVJBlnQgeyVZ927h65cJ5zsnSqG6MHh5tVPAwocEsfH27Tik_Fp-dCidmr_-rCrPfoAuASadvuFr5oAa7aAKdlLz6P0GgmCs2KzTAR6FiBMm48hd1YkrIaGzljKOwCgh0KYA3tnetbOCFEuzsmn9wmQHUA0iPQqYGlFJVfQ64949hQk42uWxCXtaO_wlXqy_TVki5LTQ7hO4reUiMXpQ',
        d: 'qhn97b91khmS-dOkHPYNu0nUZv_JDPCOmhlqtPRcFkfFsYZZuCcfyVvthM1rHD9kXuolKf26UBsVfcnaWHaqvtUyPxGhsV3yadSiwPCAR85FDzhjLxlTLL2AA6zFqSC_1Iik2hlmFmpNeqsZJL_xMROWxTi7Ke1hdX1QCnwGtdF-Emdqgf1wqBWv6VTQVd2qslQySQN8RLTYmlkHBmOHU1jc0e2QP5xbLD4-pPr7RW17WbOkW2aLsC0YYebqFaqVgLNZJIVDKetRCCgi1RcdieQ0zSuUfRc9wzhZW7HHCECASqjeFqHopG05ge-DwAcc62-H7EbKr0XWz-7SLqjTrQ',
        p: '3wSG2cBBbo6FZ0GiRucHhJhSx1U6ZRhwhrbJmSpiFG5rvHvZn-DWnOmurvO5jc1V2Qj4QAEO4w7YQh3A9PFBry_42Od5zof1GIeAOVT3REiMTOSCxMVEMWQ74UBUM2T2R_TDrBgVSuaRmX14mcZM6_SYu7JLpqeSDzZEy2cqOBs',
        q: 'xoeWkL7oZ488PsJ6_lkjCmrlxouKJgHqMHI_RVE-MGSYHDNrJ_iS4wp8CK4xhAdGukqxDm5ChqFECgdg5QfdLoCseAIC-aHrrylYrmka5_8ke-ObpW9iGFcZy-5cEH5NCr6iSb-KS6fZkxJl7g3Az6XmLoEHHmyy8QxG9Yikaz8',
        dp: 'DKUxED-6dg5Wuhgan3KSFo6cgvjuKrVMDBdpLuocTZRFP5a2LD6PbK5DXWAscUHnUDsV-GsW8QDyei09t6XGV6ycq4_UdEV5PD7Som2S56hFbEa4s3eL-lD4pDkFjTR4UnQqdCOZcXnJX66hm_aGfgqMbngZmgV-XqZxGCdtWWk',
        dq: 'uX6ijefyWiCZF8K7DL_YX7l1q8dhcxXC7TUyLOA2DR1Qirj4XEaDaCO5tJqdpVDvIsz7FhKrkgNIAV7Xh-eLIBIWE6M9iGVkQyuMspl-DFp2ilMmcLLbowZvEf5KgxafgXSRSfrvirTwM9yy5HRxPRMzOSxRrHm_0D26Z1we1B0',
        qi: 'htPHLViOVG6QrldfuHn9evfdlD-UEuViOWNx8aKR3IBv0qegpJ78vYB4hdAcJZtBslKI97En5rzOAN3Y6Y8MbI4oN77WeiePJl2cMrS64evmlERvjJ6ZTs8jK0iV5q_gIZ9Qg9drmolUgb_CccQOBFbqSL6YkXwCBxlkCrzTlhc',
        kty: 'RSA',
        alg: 'RS256',
      };

      const { sign } = makeJWT({ jwk });

      const jwt = await sign(payload);

      t.equal(
        jwt,
        'eyJraWQiOiI2OWQwMDlhYS0yMDQzLTRkNjQtOTY2NS02YWI2ZDBhZDMxNjYiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwic3ViIjoiNWE3MmU2Y2MtNmY1MS00ODhmLTk1Y2YtOTNjMGFmOTZjY2YwIiwiZXhhbXBsZSI6ImV4YW1wbGUifQ.eyQxKXhf3gveNrEzLs4uIufCw5661GnetwSgRgQoBXZxz7KFmbvORtJLpKz6sJAxw55peYnc4MaqNV9Kt9sX8E4pMdCpEVavo7xQDdJavrGMvtx3WuDyuE17PdDBkYmKWjrNxuGIet5UX2KrSz2UFaVd8X-ebcoiBXSrW1FgmgMeBCN5y_5kx5--i_dU0JFfnC9qs0FbwhAdPdY9sjt5prWX6tD_sc8qRKOcvpNOd-LTSTNGSkkxTnRXk1-A_-IgE7cM6xdkU-1ExMkG0YG272xc2wrqecyqilInTSCvuMWKs-Wza1XhJZaYzKsSpw-rdh7mtlyCBsiWo2UQIMz4AA',
      );
    });

    t.test('EdDSA', async (t) => {
      t.plan(1);

      const jwk: JsonWebKey = {
        kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
        crv: 'Ed25519',
        alg: 'EdDSA',
        use: 'sig',
        d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
        x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
        kty: 'OKP',
      };

      const { sign } = makeJWT({ jwk });

      const jwt = await sign(payload);

      t.equal(
        jwt,
        'eyJraWQiOiI2OWQwMDlhYS0yMDQzLTRkNjQtOTY2NS02YWI2ZDBhZDMxNjYiLCJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwic3ViIjoiNWE3MmU2Y2MtNmY1MS00ODhmLTk1Y2YtOTNjMGFmOTZjY2YwIiwiZXhhbXBsZSI6ImV4YW1wbGUifQ.VLkuzb9LbrJpO1uWwET7LpaUpAm4s2e640uyLD3mdFbLMj_B3fviT6FFADei1kbguRVNyq18JmTs4_euni-sAg',
      );
    });
  });

  t.test('export jwk', (t) => {
    t.plan(2);

    t.test('RSA public key', (t) => {
      t.plan(1);

      const jwk: JsonWebKey = {
        kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
        e: 'AQAB',
        n: 'rPOe2kdmQY1wN2ADn-EIKsPO_kXotIqPjbZQOoW6sIHPGS8xJqrR60JLTBir5jG8Prrp4_KoEDGm3zYlWb5EJr9BMAVHAUYB2ZMXjdojpIkKeJ_cMI0lLcSUTkKkOA6u2DnVJBlnQgeyVZ927h65cJ5zsnSqG6MHh5tVPAwocEsfH27Tik_Fp-dCidmr_-rCrPfoAuASadvuFr5oAa7aAKdlLz6P0GgmCs2KzTAR6FiBMm48hd1YkrIaGzljKOwCgh0KYA3tnetbOCFEuzsmn9wmQHUA0iPQqYGlFJVfQ64949hQk42uWxCXtaO_wlXqy_TVki5LTQ7hO4reUiMXpQ',
        d: 'qhn97b91khmS-dOkHPYNu0nUZv_JDPCOmhlqtPRcFkfFsYZZuCcfyVvthM1rHD9kXuolKf26UBsVfcnaWHaqvtUyPxGhsV3yadSiwPCAR85FDzhjLxlTLL2AA6zFqSC_1Iik2hlmFmpNeqsZJL_xMROWxTi7Ke1hdX1QCnwGtdF-Emdqgf1wqBWv6VTQVd2qslQySQN8RLTYmlkHBmOHU1jc0e2QP5xbLD4-pPr7RW17WbOkW2aLsC0YYebqFaqVgLNZJIVDKetRCCgi1RcdieQ0zSuUfRc9wzhZW7HHCECASqjeFqHopG05ge-DwAcc62-H7EbKr0XWz-7SLqjTrQ',
        p: '3wSG2cBBbo6FZ0GiRucHhJhSx1U6ZRhwhrbJmSpiFG5rvHvZn-DWnOmurvO5jc1V2Qj4QAEO4w7YQh3A9PFBry_42Od5zof1GIeAOVT3REiMTOSCxMVEMWQ74UBUM2T2R_TDrBgVSuaRmX14mcZM6_SYu7JLpqeSDzZEy2cqOBs',
        q: 'xoeWkL7oZ488PsJ6_lkjCmrlxouKJgHqMHI_RVE-MGSYHDNrJ_iS4wp8CK4xhAdGukqxDm5ChqFECgdg5QfdLoCseAIC-aHrrylYrmka5_8ke-ObpW9iGFcZy-5cEH5NCr6iSb-KS6fZkxJl7g3Az6XmLoEHHmyy8QxG9Yikaz8',
        dp: 'DKUxED-6dg5Wuhgan3KSFo6cgvjuKrVMDBdpLuocTZRFP5a2LD6PbK5DXWAscUHnUDsV-GsW8QDyei09t6XGV6ycq4_UdEV5PD7Som2S56hFbEa4s3eL-lD4pDkFjTR4UnQqdCOZcXnJX66hm_aGfgqMbngZmgV-XqZxGCdtWWk',
        dq: 'uX6ijefyWiCZF8K7DL_YX7l1q8dhcxXC7TUyLOA2DR1Qirj4XEaDaCO5tJqdpVDvIsz7FhKrkgNIAV7Xh-eLIBIWE6M9iGVkQyuMspl-DFp2ilMmcLLbowZvEf5KgxafgXSRSfrvirTwM9yy5HRxPRMzOSxRrHm_0D26Z1we1B0',
        qi: 'htPHLViOVG6QrldfuHn9evfdlD-UEuViOWNx8aKR3IBv0qegpJ78vYB4hdAcJZtBslKI97En5rzOAN3Y6Y8MbI4oN77WeiePJl2cMrS64evmlERvjJ6ZTs8jK0iV5q_gIZ9Qg9drmolUgb_CccQOBFbqSL6YkXwCBxlkCrzTlhc',
        kty: 'RSA',
        alg: 'RS256',
      };

      const key = exportJWK(jwk);

      t.same(key, { kid: jwk.kid, e: jwk.e, n: jwk.n, kty: jwk.kty, alg: jwk.alg });
    });

    t.test('Elliptic Curve public key', (t) => {
      t.plan(1);

      const jwk: JsonWebKey = {
        kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
        crv: 'Ed25519',
        alg: 'EdDSA',
        use: 'sig',
        d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
        x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
        kty: 'OKP',
      };

      const key = exportJWK(jwk);

      t.same(key, { kid: jwk.kid, crv: jwk.crv, alg: jwk.alg, use: jwk.use, x: jwk.x, kty: jwk.kty });
    });
  });
});
