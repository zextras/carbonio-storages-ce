// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {LoggerTransports} from "../../LoggerTransports";
import {LogLevelQueryString, LogLevelQueryStringType, LogLevelResponse, LogLevelResponseType} from "../types";


export default function(transports: LoggerTransports): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
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
        transports.setLevel(req.query.level)
        reply.send({level: transports.getLevel()})
      },
    })
  };
}