# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

ARG NODE_IMAGE_VERSION=22

FROM node:${NODE_IMAGE_VERSION} AS dependencies

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

# install production dependencies here, for better reuse of layers
RUN pnpm install --prod --frozen-lockfile

FROM node:${NODE_IMAGE_VERSION} AS builder

WORKDIR /usr/src/app

COPY . .

COPY --from=dependencies \
  /usr/src/app/node_modules /usr/src/app/node_modules

RUN corepack enable && corepack prepare pnpm@latest --activate

# install dependencies here, for better reuse of layers
RUN pnpm install --frozen-lockfile && pnpm store prune && pnpm run build && pnpm run pkg

FROM debian:bookworm-slim

WORKDIR /home/node/app
RUN mkdir -p /var/log/carbonio/storages/
COPY --from=builder /usr/src/app/carbonio-storages carbonio-storages

ENV STORAGES_PORT=10000
ENV STORAGES_BIND_ADDRESS=0.0.0.0
EXPOSE 10000

ENTRYPOINT ["/home/node/app/carbonio-storages"]
