import { RequestHandler } from 'express';

import { HandleAuthorizationServerMetadataRequest } from '../use-cases/authorization-server-metadata';

type AuthorizationServerMetadataHandler = RequestHandler<
  never,
  {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    scopes_supported?: string[];
    response_types_supported: string[];
    grant_types_supported: string[];
  },
  never,
  never,
  never
>;

export const makeAuthorizationServerMetadataHandler = ({
  handleAuthorizationServerMetadataRequest,
}: {
  handleAuthorizationServerMetadataRequest: HandleAuthorizationServerMetadataRequest;
}) => {
  const authorizationServerMetadataHandler: AuthorizationServerMetadataHandler = (req, res) => {
    const authorizationServerMetadataResponse = handleAuthorizationServerMetadataRequest();

    res.json({
      issuer: authorizationServerMetadataResponse.issuer,
      authorization_endpoint: authorizationServerMetadataResponse.authorizationEndpoint,
      token_endpoint: authorizationServerMetadataResponse.tokenEndpoint,
      scopes_supported: authorizationServerMetadataResponse.scopesSupported,
      response_types_supported: authorizationServerMetadataResponse.responseTypesSupported,
      grant_types_supported: authorizationServerMetadataResponse.grantTypesSupported,
    });
  };

  return { authorizationServerMetadataHandler };
};
