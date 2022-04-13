import { RequestHandler } from 'express';

import { HandleAccessTokenRequest, AccessTokenRequest } from '../use-cases/access-token';

const makeAccessTokenRequest = (req: Parameters<TokenHandler>[0]): AccessTokenRequest => ({
  headers: { authorization: req.header('authorization') },
  body: {
    grantType: typeof req.body.grant_type === 'string' ? req.body.grant_type : undefined,
    code: typeof req.body.code === 'string' ? req.body.code : undefined,
    redirectUri: typeof req.body.redirect_uri === 'string' ? req.body.redirect_uri : undefined,
    clientId: typeof req.body.client_id === 'string' ? req.body.client_id : undefined,
    clientSecret: typeof req.body.client_secret === 'string' ? req.body.client_secret : undefined,
    refreshToken: typeof req.body.refresh_token === 'string' ? req.body.refresh_token : undefined,
    scope: typeof req.body.scope === 'string' ? req.body.scope : undefined,
  },
});

type TokenHandler = RequestHandler<
  never,
  { access_token: string; token_type: string; expires_in: number; refresh_token?: string; scope?: string },
  {
    grant_type?: unknown;
    code?: unknown;
    redirect_uri?: unknown;
    client_id?: unknown;
    client_secret?: unknown;
    refresh_token?: unknown;
    scope?: unknown;
  },
  never,
  never
>;

export const makeTokenHandler = ({
  handleAccessTokenRequest,
}: {
  handleAccessTokenRequest: HandleAccessTokenRequest;
}) => {
  const tokenHandler: TokenHandler = async (req, res, next) => {
    try {
      const accessTokenRequest = makeAccessTokenRequest(req);

      const accessTokenResponse = await handleAccessTokenRequest(accessTokenRequest);

      res.json({
        access_token: accessTokenResponse.accessToken,
        token_type: accessTokenResponse.tokenType,
        expires_in: accessTokenResponse.expiresIn,
        refresh_token: accessTokenResponse.refreshToken,
        scope: accessTokenResponse.scope,
      });
    } catch (err) {
      next(err);
    }
  };

  return { tokenHandler };
};
