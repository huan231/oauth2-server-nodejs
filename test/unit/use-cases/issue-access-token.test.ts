import t from 'tap';

import { makeIssueAccessToken } from '../../../src/use-cases/issue-access-token';
import { JWT } from '../../../src/utils';

t.test('issue access token', async (t) => {
  t.plan(3);

  const issuer = 'https://as.example.com';
  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';
  const expiresIn = 900;
  const scope = 'api:read api:write';
  const jsonwebtoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  const jwtSignMock: JWT['sign'] = (payload) => {
    t.ok(payload.exp && payload.exp * 1000 > Date.now());
    t.match(payload, { iss: issuer, sub: subject, iat: Number, scope });

    return Promise.resolve(jsonwebtoken);
  };
  const jwt: JWT = { sign: jwtSignMock };

  const { issueAccessToken } = makeIssueAccessToken({ issuer, jwt });

  const accessToken = await issueAccessToken({ subject, expiresIn, scope });

  t.equal(accessToken, jsonwebtoken);
});
