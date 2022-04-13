import { randomBytes } from 'crypto';

import { epoch, seconds } from '../utils';
import { RefreshToken, RefreshTokenStorage } from '../models';

const EXPIRES_IN = seconds('30d');

export type IssueRefreshToken = (params: Pick<RefreshToken, 'subject' | 'clientId' | 'scope'>) => Promise<string>;

export const makeIssueRefreshToken = ({ refreshTokenStorage }: { refreshTokenStorage: RefreshTokenStorage }) => {
  const issueRefreshToken: IssueRefreshToken = async (params) => {
    const refreshToken = randomBytes(20).toString('hex');

    await refreshTokenStorage.addRefreshToken({ ...params, refreshToken, expirationTime: epoch() + EXPIRES_IN });

    return refreshToken;
  };

  return { issueRefreshToken };
};
