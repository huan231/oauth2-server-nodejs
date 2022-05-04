export interface AuthorizationServerMetadataResponse {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopesSupported?: string[];
  responseTypesSupported: string[];
  grantTypesSupported: string[];
}

export type HandleAuthorizationServerMetadataRequest = () => AuthorizationServerMetadataResponse;

export const makeHandleAuthorizationServerMetadataRequest = ({
  issuer,
  scopes,
}: {
  issuer: string;
  scopes: string[];
}) => {
  const authorizationEndpoint = new URL('/authorize', issuer);
  const tokenEndpoint = new URL('/token', issuer);

  const authorizationServerMetadataResponse: AuthorizationServerMetadataResponse = {
    issuer,
    authorizationEndpoint: authorizationEndpoint.href,
    tokenEndpoint: tokenEndpoint.href,
    // Claims with zero elements MUST be omitted from the response.
    //
    // https://datatracker.ietf.org/doc/html/rfc8414#section-3.2
    scopesSupported: scopes.length ? scopes : undefined,
    responseTypesSupported: ['code'],
    grantTypesSupported: ['authorization_code', 'client_credentials', 'refresh_token'],
  };

  const handleAuthorizationServerMetadataRequest: HandleAuthorizationServerMetadataRequest = () => {
    return authorizationServerMetadataResponse;
  };

  return { handleAuthorizationServerMetadataRequest };
};
