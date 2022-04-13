export interface Client {
  redirectUris: string[];
  clientId: string;
  clientSecret?: string;
}

export interface ClientStorage {
  findClient: (clientId: Client['clientId']) => Promise<Client | null>;
}
