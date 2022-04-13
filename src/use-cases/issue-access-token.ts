import { epoch, JWT } from '../utils';

export type IssueAccessToken = (params: { subject: string; expiresIn: number; scope?: string }) => Promise<string>;

export const makeIssueAccessToken = ({ issuer, jwt }: { issuer: string; jwt: JWT }) => {
  const issueAccessToken: IssueAccessToken = ({ subject, expiresIn, scope }) => {
    const issuedAt = epoch();

    return jwt.sign({ iss: issuer, sub: subject, exp: issuedAt + expiresIn, iat: issuedAt, scope });
  };

  return { issueAccessToken };
};
