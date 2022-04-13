import { Client } from './client';

export interface AuthorizationCode {
  code: string;
  subject: string;
  clientId: Client['clientId'];
  redirectUri?: string;
  scope?: string;
  expirationTime: number;
}

export interface AuthorizationCodeStorage {
  addAuthorizationCode: (authorizationCode: AuthorizationCode) => Promise<void>;
  findAuthorizationCode: (
    code: AuthorizationCode['code'],
    clientId: AuthorizationCode['clientId'],
  ) => Promise<AuthorizationCode | null>;
  deleteAuthorizationCode: (code: AuthorizationCode['code'], clientId: AuthorizationCode['clientId']) => Promise<void>;
}
