FROM node:14.16.1 as node_modules_builder_production

WORKDIR /usr/src/app

COPY package.json ./

# install production dependencies here, for better reuse of layers
RUN npm install --production

FROM node:14.16.1 as node_modules_builder

WORKDIR /usr/src/app

COPY package.json ./

COPY --from=node_modules_builder_production \
  /usr/src/app/node_modules /usr/src/app/node_modules

# install dependencies here, for better reuse of layers
RUN npm install && npm audit fix && npm cache clean --force

FROM node:14.16.1 as builder

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app

USER node

WORKDIR /home/node/app

COPY --chown=node:node --from=node_modules_builder /usr/src/app/node_modules/ ./node_modules
COPY --chown=node:node . .

EXPOSE 5794

RUN npm run build && npm run start
