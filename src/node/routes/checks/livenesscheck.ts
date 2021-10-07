import {FastifyInstance} from "fastify";

const livenessCheck: (fastify: FastifyInstance) => FastifyInstance =
  fastify => {
    return fastify.route({
      method: "GET",
      url: "/livenesscheck",
      schema:{
        tags: ['checks'],
        description: 'Checks if server is up and running, useful for health checks'
      },
      handler: async function (__, reply) {
        reply.send()
      },
    })
  }

export default livenessCheck