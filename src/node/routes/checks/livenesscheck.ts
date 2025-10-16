// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";

const livenessCheck: (fastify: FastifyInstance) => FastifyInstance =
  fastify => {
    return fastify.route({
      method: "GET",
      url: "/health/live",
      schema:{
        tags: ['health'],
        description: 'Checks if server is running, useful for health checks',
        response: {
          200: {
            type: 'null',
            description: 'Server is running'
          }
        }

      },
      async handler (__, reply) {
        reply.code(200).send()
      },
    })
  }

export default livenessCheck