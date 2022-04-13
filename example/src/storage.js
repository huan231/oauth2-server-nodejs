import { MemoryAdapter } from 'oauth2-server-nodejs';

const makeAuthorizationCodeKey = (code, clientId) => ['authorization-code', clientId, code].join(':');
const makeRefreshTokenKey = (refreshToken, clientId) => ['refresh-token', clientId, refreshToken].join(':');
const makeAccessGrantKey = (username, clientId) => ['access-grant', clientId, username].join(':');

export class Storage extends MemoryAdapter {
  #client;
  #users;

  constructor(client, clients, users) {
    super({ clients });

    this.#client = client;
    this.#users = users;
  }

  async #connect() {
    if (!this.#client.isOpen) {
      await this.#client.connect();
    }
  }

  async addAuthorizationCode(authorizationCode) {
    await this.#connect();

    const key = makeAuthorizationCodeKey(authorizationCode.code, authorizationCode.clientId);

    await this.#client.set(key, JSON.stringify(authorizationCode), { EXAT: authorizationCode.expirationTime });
  }

  async addRefreshToken(refreshToken) {
    await this.#connect();

    const key = makeRefreshTokenKey(refreshToken.refreshToken, refreshToken.clientId);

    await this.#client.set(key, JSON.stringify(refreshToken), { EXAT: refreshToken.expirationTime });
  }

  async addAccessGrant(accessGrant) {
    await this.#connect();

    const key = makeAccessGrantKey(accessGrant.username, accessGrant.clientId);

    await this.#client.set(key, JSON.stringify(accessGrant), { EX: 15 });
  }

  async deleteAuthorizationCode(code, clientId) {
    await this.#connect();

    await this.#client.del(makeAuthorizationCodeKey(code, clientId));
  }

  async deleteRefreshToken(refreshToken, clientId) {
    await this.#connect();

    await this.#client.del(makeRefreshTokenKey(refreshToken, clientId));
  }

  async findAuthorizationCode(code, clientId) {
    const rawAuthorizationCode = await this.#client.get(makeAuthorizationCodeKey(code, clientId));

    return rawAuthorizationCode ? JSON.parse(rawAuthorizationCode) : null;
  }

  async findRefreshToken(refreshToken, clientId) {
    await this.#connect();

    const rawRefreshToken = await this.#client.get(makeRefreshTokenKey(refreshToken, clientId));

    return rawRefreshToken ? JSON.parse(rawRefreshToken) : null;
  }

  async findAccessGrant(username, clientId) {
    await this.#connect();

    const rawAccessGrant = await this.#client.get(makeAccessGrantKey(username, clientId));

    return rawAccessGrant ? JSON.parse(rawAccessGrant) : null;
  }

  findUser(username, password) {
    return this.#users.find((user) => user.username === username && user.password === password);
  }
}
