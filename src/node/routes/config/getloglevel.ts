import {FastifyInstance} from "fastify";
import {LoggerTransports} from "../../LoggerTransports";
import {LogLevelResponseType} from "../types";

export default function(transports: LoggerTransports): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route({
      method: "GET",
      url: "/loglevel",
      schema: {
        tags: ['config'],
        description: 'Returns log level',
        response: {
          200: LogLevelResponseType
        }
      },
      handler: async function (__, reply) {
        reply.send({level: transports.getLevel()})
      },
    })
  };
}