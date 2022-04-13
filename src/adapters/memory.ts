import { Storage } from '../use-cases';
import { AuthorizationCode, Client, RefreshToken } from '../models';

export class MemoryAdapter implements Storage {
  private readonly authorizationCodes = new Map<string, AuthorizationCode>();
  private readonly clients = new Map<Client['clientId'], Client>();
  private readonly refreshTokens = new Map<string, RefreshToken>();

  constructor({
    authorizationCodes = [],
    clients = [],
    refreshTokens = [],
  }: {
    authorizationCodes?: AuthorizationCode[];
    clients?: Client[];
    refreshTokens?: RefreshToken[];
  } = {}) {
    authorizationCodes.forEach((authorizationCode) => this.addAuthorizationCode(authorizationCode));
    clients.forEach((client) => this.addClient(client));
    refreshTokens.forEach((refreshToken) => this.addRefreshToken(refreshToken));
  }

  addAuthorizationCode(authorizationCode: AuthorizationCode) {
    const key = [authorizationCode.clientId, authorizationCode.code].join(':');

    this.authorizationCodes.set(key, authorizationCode);

    return Promise.resolve();
  }

  private addClient(client: Client) {
    this.clients.set(client.clientId, client);

    return Promise.resolve();
  }

  addRefreshToken(refreshToken: RefreshToken) {
    const key = [refreshToken.clientId, refreshToken.refreshToken].join(':');

    this.refreshTokens.set(key, refreshToken);

    return Promise.resolve();
  }

  deleteAuthorizationCode(code: AuthorizationCode['code'], clientId: AuthorizationCode['clientId']): Promise<void> {
    const key = [clientId, code].join(':');

    this.authorizationCodes.delete(key);

    return Promise.resolve();
  }

  deleteRefreshToken(refreshToken: RefreshToken['refreshToken'], clientId: Client['clientId']) {
    const key = [clientId, refreshToken].join(':');

    this.refreshTokens.delete(key);

    return Promise.resolve();
  }

  findAuthorizationCode(code: AuthorizationCode['code'], clientId: AuthorizationCode['clientId']) {
    const key = [clientId, code].join(':');

    return Promise.resolve(this.authorizationCodes.get(key) ?? null);
  }

  findClient(clientId: Client['clientId']) {
    return Promise.resolve(this.clients.get(clientId) ?? null);
  }

  findRefreshToken(refreshToken: RefreshToken['refreshToken'], clientId: Client['clientId']) {
    const key = [clientId, refreshToken].join(':');

    return Promise.resolve(this.refreshTokens.get(key) ?? null);
  }
}
