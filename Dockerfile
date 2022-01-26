# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

ARG NODE_IMAGE_VERSION

FROM node:${NODE_IMAGE_VERSION} as node_modules_builder_production

WORKDIR /usr/src/app

COPY package.json ./

# install production dependencies here, for better reuse of layers
RUN npm install --production

FROM node:${NODE_IMAGE_VERSION} as node_modules_builder

WORKDIR /usr/src/app

COPY package.json ./

COPY --from=node_modules_builder_production \
  /usr/src/app/node_modules /usr/src/app/node_modules

# install dependencies here, for better reuse of layers
RUN npm install && npm audit fix && npm cache clean --force

FROM node:${NODE_IMAGE_VERSION} as builder

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app
RUN mkdir -p /var/log/carbonio/storages/
RUN chown -R node:node /var/log/carbonio/storages/
RUN mkdir -p /opt/zextras/store/storages-ce
RUN chown -R node:node /opt/zextras/store/storages-ce

USER node

WORKDIR /home/node/app

COPY --chown=node:node --from=node_modules_builder /usr/src/app/node_modules/ ./node_modules
COPY --chown=node:node . .

EXPOSE 5794

RUN npm run build
ENTRYPOINT npm run start
