import {FastifyInstance} from "fastify";
import {Config} from "../../config/configuration";
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
        const incompleteConfig: any = {... config}
        // remove awsv4signature access-keys and secrets for security
        delete incompleteConfig.awsv4signature
        reply.send(incompleteConfig)
      },
    })
  };
}