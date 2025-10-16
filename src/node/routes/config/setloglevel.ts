// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {LogLevelQueryString, LogLevelQueryStringType, LogLevelResponse, LogLevelResponseType} from "../types";
import pino from "pino";

export const setLogLevel: (logger: pino.Logger | undefined) => (fastify: FastifyInstance) => FastifyInstance =
  logger => fastify => {
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
      async handler (req, reply) {
        fastify.log.level = req.query.level;
        if (logger !== undefined) {
          logger.level = req.query.level;
        }
        reply.send({level: req.query.level})
      },
    })
  };