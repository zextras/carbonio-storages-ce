// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";

const redirectToSwagger: (fastify: FastifyInstance) => FastifyInstance =
    fastify => {
      return fastify.route({
        method: "GET",
        url: "/",
        schema:{
          tags: ['swagger'],
          description: 'Shows APIs'
        },
        handler: async function (__, reply) {
          reply.redirect("swagger/static/index.html")
        },
      })
    }

export default redirectToSwagger