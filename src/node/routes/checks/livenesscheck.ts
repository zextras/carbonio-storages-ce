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
        fastify.log.trace("questo è un log a livello trace")
        fastify.log.debug("questo è un log a livello debug")
        fastify.log.info("questo è un log a livello info")
        fastify.log.warn("questo è un log a livello warn")
        fastify.log.error("questo è un log a livello error")
        fastify.log.fatal("questo è un log a livello fatal")
        reply.send()
      },
    })
  }

export default livenessCheck