import fastifyMultipart from "fastify-multipart"
import fastifySwagger from "fastify-swagger"
import router from "./routes/router";
import {Config} from "./config/config";
import oasSchema from "./oasSchema";
import {LocalFilesystemAccessor} from "./filesystem/LocalFilesystemAcessor";
import {LocalPathStrategy} from "./filesystem/FilePathStategy";
import winston, {Logger} from "winston";
import 'winston-daily-rotate-file';
import {FastifyInstance} from "fastify";
import {IncomingMessage, Server, ServerResponse} from "http";
import {LoggerTransports} from "./LoggerTransports";
import {GzipWrapperFilesystemAccessor} from "./filesystem/GzipWrapperFilesystemAccessor";
import {FastifyRequest} from "fastify/types/request";
import {logRequestError, logRequestReceived} from "./routes/filestore/loggingutils";

export function createApp(config: Config):FastifyInstance<Server, IncomingMessage, ServerResponse> {

  const pathStrategy = new LocalPathStrategy(config)
  const localfilesystem = new LocalFilesystemAccessor(config, pathStrategy)

  const filesystem = config.compress? new GzipWrapperFilesystemAccessor(localfilesystem) : localfilesystem

  const loggerTransports = LoggerTransports.createTransports(config)
  const winstonLogger: Logger = createLogger(config, loggerTransports);

  const server = require('fastify')({
    logger: winstonLogger,
  })

  server.setNotFoundHandler((request: FastifyRequest, reply: any) => {
    server.log.warn('Route not found: ' +  request.url)
    reply.status(404).send({ message: 'Not found' })
  })

  server.addHook('onRequest', async (request: FastifyRequest) => {
    logRequestReceived(server, request, "Request received")
  });

  server.addHook('onError', async (request: FastifyRequest, __: any, error: Error) => {
    logRequestError(server, request, error)
  })

  server.ready(async (err:any) => {
    if (err) {
      server.log.error(`Error occurred: ${err}`)
      throw err;
    } else {
      server.log.info(`Started server:`)
      server.log.info(JSON.stringify(config, null, 2))
    }
  })

  server.register(fastifyMultipart);
  server.register(fastifySwagger, oasSchema(config.servingURLPrefix, config.baseURL, "localhost"));

  server.register(router(config, filesystem, loggerTransports));
  
  return server;
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
      winston.format.printf(({ message, timestamp, level }) => `[${timestamp}] [${level}] ${message}`)
    ),
    transports: loggerTransports.transports
  });
}

