import express, { urlencoded } from 'express';
import cookieSession from 'cookie-session';
import { createClient } from 'redis';
import { oAuth2ServerMiddleware, Unauthenticated, UnresolvedAuthorization } from 'oauth2-server-nodejs';

import { Storage } from './storage';

const client = createClient({ url: process.env.REDIS_URL });

const app = express();

app.set('view engine', 'ejs');
app.set('views', new URL('./views', import.meta.url).pathname);

app.use(urlencoded({ extended: false }));
app.use(cookieSession({ signed: false, maxAge: 24 * 60 * 60 * 1000 }));

const storage = new Storage(
  client,
  [
    {
      clientId: 's6BhdRkqt3',
      clientSecret: 'cf136dc3c1fc93f31185e5885805d',
      redirectUris: ['https://client.example.org/callback', 'https://client.example.org/callback2'],
    },
  ],
  [{ username: 'demouser', password: 'demopass' }],
);

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/authorize', async (req, res, next) => {
  try {
    if (!req.session.user) {
      const user = storage.findUser(req.body.username, req.body.password);

      if (!user) {
        return res.render('signin');
      }

      req.session = { user };
    }

    if (
      req.session.consent &&
      req.session.consent.clientId === req.query.client_id &&
      req.session.consent.scope === req.query.scope
    ) {
      const isAuthorized = req.body.authorize === '1';

      if (isAuthorized) {
        await storage.addAccessGrant({
          username: req.session.user.username,
          clientId: req.session.consent.clientId,
          scopes: req.session.consent.scope?.split(' ') ?? [],
        });
      } else {
        req.session = { ...req.session, consent: { ...req.session.consent, isAuthorized: false } };
      }
    }

    res.redirect(303, req.originalUrl);
  } catch (err) {
    next(err);
  }
});

const ISSUER = process.env.ISSUER || 'https://as.example.com';

app.use(
  oAuth2ServerMiddleware({
    authenticate: (req) => (client, authorizationRequest) => {
      if (!req.session.user) {
        throw new Unauthenticated(client, authorizationRequest);
      }

      return Promise.resolve(req.session.user.username);
    },
    authorize: (req) => async (client, authorizationRequest) => {
      const accessGrant = await storage.findAccessGrant(req.session.user.username, client.clientId);

      if (accessGrant) {
        const scopes = authorizationRequest.query.scope?.split(' ') ?? [];

        if (scopes.every((scope) => accessGrant.scopes.includes(scope))) {
          return true;
        }
      }

      if (
        req.session.consent &&
        req.session.consent.clientId === client.clientId &&
        req.session.consent.scope === authorizationRequest.query.scope
      ) {
        if (req.session.consent.isAuthorized === false) {
          const session = { ...req.session };

          delete session.consent;

          req.session = session;

          return false;
        }
      } else {
        req.session = {
          ...req.session,
          consent: { clientId: client.clientId, scope: authorizationRequest.query.scope },
        };
      }

      throw new UnresolvedAuthorization(client, authorizationRequest);
    },
    storage,
    issuer: ISSUER,
    jwk: {
      kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
      crv: 'Ed25519',
      alg: 'EdDSA',
      use: 'sig',
      d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
      x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
      kty: 'OKP',
    },
    scopes: ['api:read', 'api:write'],
  }),
);

app.use((err, req, res, next) => {
  if (err instanceof Unauthenticated) {
    res.render('signin');
  } else if (err instanceof UnresolvedAuthorization) {
    const client = err.client;
    const authorizationRequest = err.req;

    res.render('authorize', { clientId: client.clientId, scopes: authorizationRequest.query.scope?.split(' ') ?? [] });
  } else {
    next(err);
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`app listening on port ${PORT}`);
});
