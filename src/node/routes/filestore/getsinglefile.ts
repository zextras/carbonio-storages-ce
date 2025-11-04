// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {ErrorType, QueryString} from "../types";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Static, Type} from "@sinclair/typebox";
import {Identifier, parse} from "../../filesystem/Identifier";

const DownloadResponseType = Type.Any()

const ResponseType = Type.Union([DownloadResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: QueryString, Reply: Response}>({
      method: "GET",
      url: "/download",
      schema: {
        tags: ['filestore'],
        description: 'Downloads from Storages-CE the node described by node-id and version (if needed) passed as query string parameters',
        querystring: {
          type: 'object',
          required: ['type'],
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["files", "chats", "node"],
            },
            node : {
              type: 'string',
              format: 'uuid'
            },
            fileName : {
              type: 'string'
            },
            basePath : {
              type: 'string'
            },
            version : {
              type: 'number'
            }
          }
        },
        produces: ['application/octet-stream', 'application/json'],
        response: {
          200: {
            type: "string",
            format: "binary"
          },
          404: ErrorType,
        }
      },
      async handler (req, reply) {
        const identifier: Identifier = parse(req.query)
        const fileName = identifier.toFilename();

        if (!await filesystem.fileExists(identifier)) {
          const error = {
            statusCode : 404,
            error : "Not found",
            message : `File '${fileName}' does not exist`
          }

          reply.status(404)
            .type('application/json')
            .send(error)
        } else {
          reply.type('application/octet-stream')
            .send(await filesystem.openReadStream(identifier));
          return reply;
        }
      },
    })
  };
}