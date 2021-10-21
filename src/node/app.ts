import fastifyMultipart from "fastify-multipart"
import fastifySwagger from "fastify-swagger"
import router from "./routes/router";
import {Config} from "./config/configuration";
import oasSchema from "./oasSchema";
import {LocalFilesystemAccessor} from "./filesystem/LocalFilesystemAcessor";
import {LocalPathStrategy} from "./filesystem/FilePathStategy";
import winston, {Logger} from "winston";
import 'winston-daily-rotate-file';
import {FastifyInstance, FastifyReply} from "fastify";
import {IncomingMessage, Server, ServerResponse} from "http";
import {LoggerTransports} from "./LoggerTransports";
import {GzipWrapperFilesystemAccessor} from "./filesystem/GzipWrapperFilesystemAccessor";
import {FastifyRequest} from "fastify/types/request";
import {createContext, logRequestError, logRequestReceived} from "./loggingutils";
import * as fs from "fs";
import {AuthFactory} from "./auth/AuthFactory";
import {AuthError} from "./auth/AuthError";
import os from "os"

export function createApp(config: Config):FastifyInstance<Server, IncomingMessage, ServerResponse> {

  const pathStrategy = new LocalPathStrategy(config)
  const localfilesystem = new LocalFilesystemAccessor(config, pathStrategy)

  const filesystem = config.compress? new GzipWrapperFilesystemAccessor(localfilesystem) : localfilesystem

  const loggerTransports = LoggerTransports.createTransports(config)
  const winstonLogger: Logger = createLogger(config, loggerTransports);

  // fastify basic common configuration
  let fastifyConfig: any = {logger: winstonLogger}

  // enables https on fastify
  if (config.https && Object.keys(config.https).length > 0) {
    fastifyConfig = {
      ... fastifyConfig,
      https: {
        key: fs.readFileSync(config.https.keyPath),
        cert: fs.readFileSync(config.https.certPath)
      }
    }
  }

  const server = require('fastify')(fastifyConfig)

  server.setNotFoundHandler((request: FastifyRequest, reply: any) => {
    server.log.warn('Route not found: ' +  request.url)
    reply.status(404).send({ message: 'Not found' })
  })

  const auth = AuthFactory.create(config)
  server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    logRequestReceived(server, request, "Request received")
    try {
      await auth.check(server, request)
    } catch(e) {
      if (e instanceof AuthError) {
        server.log.error(`[${createContext(request)}] Authentication failed`)
        reply.status(401).send()
      }
      else {
        throw e
      }
    }
  });

  server.addHook('onError', async (request: FastifyRequest, __: any, error: Error) => {
    logRequestError(server, request, error)
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

  server.register(fastifyMultipart);
  server.register(fastifySwagger, oasSchema(config.servingURLPrefix, config.baseURL, "localhost"));

  server.register(router(config, filesystem, loggerTransports));

  return server;
}

function censor(obj: any) {
  let i = 0;

  return function(_key: any, value: any) {
    if(i !== 0 && typeof(obj) === 'object' && typeof(value) == 'object' && obj == value)
      return '[Circular]';

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;
  }
}

function createLogger(config: Config, loggerTransports: LoggerTransports) {
  return winston.createLogger({
    // Define levels required by Fastify (by default winston has verbose level and does not have trace)
    levels: {
      fatal: 0,
      error: 1,
      warn: 2,
      info: 3,
      trace: 4,
      debug: 5
    },
    level: config.logging.defaultLevel,
    /**
     * Documentation for winston.format:
     * https://github.com/winstonjs/logform#readme
     */
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors(),
      winston.format.printf(
          ({ message, timestamp, level }) => {
            const messageStr = (typeof message === 'object') ?
                JSON.stringify(message, censor(message)) : message;
            return `[${timestamp}] [${level}] ${messageStr}`;
          })
    ),
    transports: loggerTransports.transports
  });
}

