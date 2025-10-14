// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {LogLevelQueryString, LogLevelQueryStringType, LogLevelResponse, LogLevelResponseType} from "../types";

export const setLogLevel: (fastify: FastifyInstance) => FastifyInstance = 
  fastify => {
    return fastify.route<{Querystring: LogLevelQueryString, Reply: LogLevelResponse}>({
      method: "PUT",
      url: "/loglevel",
      schema: {
        tags: ['config'],
        querystring: LogLevelQueryStringType,
        description: 'Sets log level',
        response: {
          200: LogLevelResponseType
        }
      },
      handler: async function (req, reply) {
        fastify.log.level = req.query.level;
        reply.send({level: req.query.level})
      },
    })
  };