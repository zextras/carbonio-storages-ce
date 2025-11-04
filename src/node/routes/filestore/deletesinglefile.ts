// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {QueryString} from "../types";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Identifier, parse} from "../../filesystem/Identifier";

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: QueryString}>({
      method: "DELETE",
      url: "/delete",
      schema: {
        tags: ['filestore'],
        description: 'Deletes from Storages-CE node described by node-id and version (if needed) passed as query string parameters',
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
        }
      },
      async handler(req, reply) {
        const identifier: Identifier = parse(req.query)

        if (await filesystem.deleteFile(identifier)) {
          reply.send("Deleted file " + filesystem.fileIdentifier(identifier))
        }
        reply.send()
      },
    })
  };
}