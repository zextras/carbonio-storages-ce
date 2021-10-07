import {FastifyInstance} from "fastify";
import {Config} from "../../config/config";
import {Type} from "@sinclair/typebox";

export default function(config: Config): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route({
      method: "GET",
      url: "/config",
      schema: {
        tags: ['config'],
        description: 'Returns startup configuration',
        response: {
          200: Type.Object({}, {additionalProperties: true})
        }
      },
      handler: async function (__, reply) {
        reply.send(config)
      },
    })
  };
}