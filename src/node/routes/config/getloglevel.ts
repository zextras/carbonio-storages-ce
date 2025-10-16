// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import { LogLevelResponseType } from "../types";

export const getLogLevel: (fastify: FastifyInstance) => FastifyInstance  = fastify => {
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
      async handler (__, reply) {
        reply.send({level: fastify.log.level})
      },
    })
  };