import t from 'tap';

import { makeIssueRefreshToken } from '../../../src/use-cases/issue-refresh-token';
import { RefreshTokenStorage } from '../../../src/models';

t.test('issue refresh token', async (t) => {
  t.plan(3);

  const subject = '5a72e6cc-6f51-488f-95cf-93c0af96ccf0';
  const clientId = 's6BhdRkqt3';
  const scope = 'api:read api:write';

  const addRefreshTokenMock: RefreshTokenStorage['addRefreshToken'] = (refreshToken) => {
    t.ok(refreshToken.expirationTime * 1000 > Date.now());
    t.match(refreshToken, { refreshToken: String, subject, clientId, scope });

    return Promise.resolve();
  };

  const refreshTokenStorage = { addRefreshToken: addRefreshTokenMock } as RefreshTokenStorage;

  const { issueRefreshToken } = makeIssueRefreshToken({ refreshTokenStorage });

  const refreshToken = await issueRefreshToken({ subject, clientId, scope });

  t.type(refreshToken, 'string');
});
