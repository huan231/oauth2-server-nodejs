import { Client } from './client';

export interface RefreshToken {
  refreshToken: string;
  subject: string;
  clientId: Client['clientId'];
  scope?: string;
  expirationTime: number;
}

export interface RefreshTokenStorage {
  addRefreshToken: (refreshToken: RefreshToken) => Promise<void>;
  findRefreshToken: (
    refreshToken: RefreshToken['refreshToken'],
    clientId: Client['clientId'],
  ) => Promise<RefreshToken | null>;
  deleteRefreshToken: (refreshToken: RefreshToken['refreshToken'], clientId: Client['clientId']) => Promise<void>;
}
