# oauth2-server-nodejs

![NPM](https://img.shields.io/npm/l/oauth2-server-nodejs)
![npm](https://img.shields.io/npm/v/oauth2-server-nodejs)

_OAuth 2.0 Authorization Server implementation for Node.js_

## Introduction

What is an OAuth 2.0 Authorization Server?

> The server issuing access tokens to the client after successfully authenticating the resource owner and obtaining
> authorization.

## Prerequisites

It's recommended that you have a basic understanding of OAuth 2.0 protocol, JSON Web Tokens (JWT) and express web
framework.

You may find it helpful to take a look at the following:

- [OAuth 2.0](https://www.oauth.com/oauth2-servers/getting-ready/)
- [Introduction to JSON Web Tokens](https://jwt.io/introduction)
- [Express/Node introduction](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction)

## Installation

oauth2-server-nodejs is available as a [npm package](https://www.npmjs.com/package/oauth2-server-nodejs).

```sh
npm install oauth2-server-nodejs express
```

## Getting started

Here is an example of a basic app using `oauth2-server-nodejs` middleware

```ts
import express from 'express';
import { MemoryAdapter, oAuth2ServerMiddleware, Unauthenticated } from 'oauth2-server-nodejs';

const app = express();

app.use(
  oAuth2ServerMiddleware({
    authenticate: (req) => (client, authorizationRequest) => {
      if (!req.user) {
        throw new Unauthenticated(client, authorizationRequest);
      }

      return Promise.resolve(req.user.id);
    },
    authorize: () => () => Promise.resolve(true),
    storage: new MemoryAdapter({ clients: [/* OAuth 2.0 clients */] }),
    issuer: 'https://as.example.com',
    jwk: {
      kid: '69d009aa-2043-4d64-9665-6ab6d0ad3166',
      crv: 'Ed25519',
      alg: 'EdDSA',
      use: 'sig',
      d: 'a2B7AkpDPkFliSk5Ls2YzGQRmS8-y15d5bAdAcbf-oo',
      x: 'tFxkk7eoMyE9CYXSWYkDCIB0ETaFW6q8CGo7poHnoSs',
      kty: 'OKP',
    },
  }),
);
```

## Example

You may check the [example folder](https://github.com/huan231/oauth2-server-nodejs/tree/master/example) and view the
source code or visit a deployed instance over
at [oauth2-server-nodejs.herokuapp.com](https://oauth2-server-nodejs.herokuapp.com/).

## Implemented specs

- [RFC6749 - The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC6750 - The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [RFC8414 - OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)

## License

This project is licensed under the terms of
the [MIT license](https://github.com/huan231/oauth2-server-nodejs/blob/master/LICENSE).
