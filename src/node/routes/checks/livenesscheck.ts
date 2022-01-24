import {FastifyInstance} from "fastify";

const livenessCheck: (fastify: FastifyInstance) => FastifyInstance =
  fastify => {
    return fastify.route({
      method: "GET",
      url: "/health/live",
      schema:{
        tags: ['health'],
        description: 'Checks if server is running, useful for health checks'
      },
      handler: async function (__, reply) {
        reply.send()
      },
    })
  }

export default livenessCheck