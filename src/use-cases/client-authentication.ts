import { Buffer } from 'buffer';

import { Client, ClientStorage } from '../models';
import { decodeFormURLComponent, InvalidClient, InvalidRequest } from '../utils';

export interface ClientAuthenticationRequest {
  headers: { authorization?: string };
  body: {
    clientId?: string;
    clientSecret?: string;
  };
}

type ClientCredentials = Pick<Client, 'clientId' | 'clientSecret'>;
type ClientAuthenticationMethod = 'client_secret_basic' | 'client_secret_post' | 'none';

const DEFAULT_METHODS: ClientAuthenticationMethod[] = ['client_secret_basic', 'client_secret_post', 'none'];
const BA_PREFIX = 'Basic ';

export type HandleClientAuthentication = (
  req: ClientAuthenticationRequest,
  methods?: ClientAuthenticationMethod[],
) => Promise<Client>;

export const makeHandleClientAuthentication = ({ clientStorage }: { clientStorage: ClientStorage }) => {
  const handleClientSecretBasicMethod = (req: ClientAuthenticationRequest) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith(BA_PREFIX)) {
      return null;
    }

    const [clientId, clientSecret] = Buffer.from(req.headers.authorization.substring(BA_PREFIX.length), 'base64')
      .toString()
      .split(':');

    if (!clientId || !clientSecret) {
      return null;
    }

    return { clientId: decodeFormURLComponent(clientId), clientSecret: decodeFormURLComponent(clientSecret) };
  };

  const handleClientSecretPostMethod = (req: ClientAuthenticationRequest) => {
    if (!req.body.clientId || !req.body.clientSecret) {
      return null;
    }

    return { clientId: req.body.clientId, clientSecret: req.body.clientSecret };
  };

  const handleNoneMethod = (req: ClientAuthenticationRequest) => {
    if (!req.body.clientId) {
      return null;
    }

    return { clientId: req.body.clientId, clientSecret: undefined };
  };

  const handleClientAuthentication: HandleClientAuthentication = async (req, methods = DEFAULT_METHODS) => {
    const credentials = [...methods]
      .sort((a) => (a === 'none' ? 1 : -1))
      .reduce<ClientCredentials[]>((credentials, method) => {
        let clientCredentials: ClientCredentials | null = null;

        switch (method) {
          case 'client_secret_basic':
            clientCredentials = handleClientSecretBasicMethod(req);
            break;
          case 'client_secret_post':
            clientCredentials = handleClientSecretPostMethod(req);
            break;
          case 'none': {
            if (!credentials.length) {
              clientCredentials = handleNoneMethod(req);
            }
          }
        }

        if (clientCredentials) {
          credentials.push(clientCredentials);
        }

        return credentials;
      }, []);

    switch (credentials.length) {
      case 0:
        throw new InvalidClient('the client authentication failed due to missing credentials');
      case 1:
        break;
      default:
        throw new InvalidRequest('the request utilizes more than one mechanism for authenticating the client');
    }

    const client = await clientStorage.findClient(credentials[0].clientId);

    if (!client || client.clientSecret !== credentials[0].clientSecret) {
      throw new InvalidClient('the client authentication failed due to invalid credentials');
    }

    return client;
  };

  return { handleClientAuthentication };
};
