#!/bin/bash

set -eux

docker rm --force oauth2-server-nodejs-redis 2>/dev/null
docker run --name oauth2-server-nodejs-redis -d -p 6379:6379 redis:6.2-alpine
