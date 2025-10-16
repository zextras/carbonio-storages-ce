// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import fastify from 'fastify'
import fastifyMultipart from "@fastify/multipart"
import fastifySwagger from "@fastify/swagger"
import router from "./routes/router";
import {Config, LoggingOptions} from "./config/configuration";
import oasSchema from "./oasSchema";
import {LocalFilesystemAccessor} from "./filesystem/LocalFilesystemAcessor";
import {LocalPathStrategy} from "./filesystem/FilePathStategy";
import {GzipWrapperFilesystemAccessor} from "./filesystem/GzipWrapperFilesystemAccessor";
import {FastifyRequest} from "fastify/types/request";
import {createContext} from "./loggingutils";
import * as fs from "fs";
import {AuthFactory} from "./auth/AuthFactory";
import {AuthError} from "./auth/AuthError";
import os from "os"
import fastifySwaggerUi from '@fastify/swagger-ui';
import * as rfs from "rotating-file-stream";

import pino from 'pino';
import pretty from 'pino-pretty'

export async function createApp(config: Config) {

  const pathStrategy = new LocalPathStrategy(config)
  const localfilesystem = new LocalFilesystemAccessor(config, pathStrategy)

  const filesystem = config.compress? new GzipWrapperFilesystemAccessor(localfilesystem) : localfilesystem

  const logger = config.logging && createLogger(config.logging) ;

  const https = (config.https && Object.keys(config.https).length > 0) ? {
    https: {
      key: fs.readFileSync(config.https.keyPath),
      cert: fs.readFileSync(config.https.certPath)
    }
  } : {};

  const server = fastify({
      loggerInstance: logger,
      ...https
    })

  server.setNotFoundHandler((request, reply) => {
    server.log.warn('Route not found: ' +  request.url)
    reply.status(404).send({ message: 'Not found' })
  })

  const auth = AuthFactory.create(config)
  server.addHook('onRequest', async (request, reply) => {
    request.log.info(`[${createContext(request)}] Request received`)
    try {
      await auth.check(request)
    } catch(e) {
      if (e instanceof AuthError) {
        request.log.error(`[${createContext(request)}] Authentication failed`)
        reply.status(401).send()
      }
      else {
        throw e
      }
    }
  });

  server.addHook('onError', async (request: FastifyRequest, __: any, error: Error) => {
    request.log.error(`[${createContext(request)}] ${error}`)
  })

  server.ready(async (err:any) => {
    if (err) {
      server.log.error(`Error occurred: ${err}`)
      throw err;
    } else {
      server.log.debug(JSON.stringify(os.networkInterfaces(), null, 2))
      server.log.info(`Started server:`)
      server.log.info(JSON.stringify(config, null, 2))
    }
  })

  const swaggerUiOptions = {
      routePrefix: "/",
      exposeRoute: true,
  };

  await server.register(fastifyMultipart, {
    limits: {
      fileSize: Infinity,
      parts: Infinity
    }
  });

  await server.register(fastifySwagger, oasSchema(config.servingURLPrefix, config.baseURL, config.bindAddress));
  await server.register(fastifySwaggerUi, swaggerUiOptions);

  await server.register(router(config, filesystem));

  return server;
}

function createLogger(logging: LoggingOptions) {
  const fileStream = createFileLogger(logging)
  const consoleStream = pretty({
    colorize: true,
    messageFormat: '{msg}',
    translateTime: 'SYS:standard',
    ignore: 'hostname',
  });
  const stream = pino.multistream([
    { stream: fileStream, level: logging.defaultLevel },
    { stream: consoleStream, level: logging.defaultLevel }
  ])
  return pino({
    level: logging.defaultLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      }
    }
  }, stream)
}

function createFileLogger(logging: LoggingOptions) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const fileNameGenerator = (time: number | Date): string => {
    const currentTime = (time === undefined || time === null) ? new Date() :
      (typeof time === "number" ? new Date(time) : time);
    const formattedDate = formatter.formatToParts(currentTime).filter(p => p.type !== 'literal').map(p => p.value).join('-');
    return logging.filename.replace( "%DATE%", formattedDate );
  };
  return rfs.createStream(fileNameGenerator, {
      interval: '1d',
      path: logging.dirname,
      compress: 'gzip',
  })
}

