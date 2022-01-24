// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {LoggerTransports} from "../../LoggerTransports";
import {LogLevelResponseType} from "../types";

export default function(transports: LoggerTransports): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
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
      handler: async function (__, reply) {
        reply.send({level: transports.getLevel()})
      },
    })
  };
}