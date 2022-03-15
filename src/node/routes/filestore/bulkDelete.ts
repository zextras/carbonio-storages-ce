// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FastifyInstance } from "fastify";
import { ChatsQueryStringType, ChatsType, FilesQueryStringType, FilesType, QueryString, QueryStringType } from "../types";
import { FilesystemAccessor } from "../../filesystem/FilesystemAccessor";
import { parse } from "../../filesystem/Identifier";
import { Static, Type } from "@sinclair/typebox";

const BulkDeleteQueryStringType = Type.Object({
  type: Type.Union([ChatsType, FilesType])
})

type BulkDeleteQueryString = Static<typeof BulkDeleteQueryStringType>

const NodeIdType = Type.Union([
  Type.Omit(FilesQueryStringType, ["type"]),
  Type.Omit(ChatsQueryStringType, ["type"])
])

const BulkDeleteRequestBodyType = Type.Object({
  ids: Type.Array(NodeIdType)
})

const BulkDeleteResponseBodyType = Type.Object({
  ids: Type.Array(QueryStringType)
})

type BulkDeleteRequestBody = Static<typeof BulkDeleteRequestBodyType>
type BulkDeleteResponseBody = Static<typeof BulkDeleteResponseBodyType>

const bulkDeleteItems = {
  type: 'object',
  required: ['ids'],
  additionalProperties: false,
  properties: {
    "ids": {
      type: "array",
      items: {
        type: 'object',
        required: ['node'],
        additionalProperties: false,
        properties: {
          node : {
            type: 'string',
            format: 'uuid'
          },
          version : {
            type: 'number'
          }
        }
      }
    }
  }
}

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: BulkDeleteQueryString, Body:BulkDeleteRequestBody, Response:BulkDeleteResponseBody }>({
      method: "POST",
      url: "/bulk-delete",
      schema: {
        tags: ['filestore'],
        description: 'Deletes from Storages-CE node described by "node-ids" of type "type"',
        querystring: {
          type: 'object',
          required: ['type'],
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["files", "chats"],
            }
          }
        },
        body: bulkDeleteItems,
        response: {
          200: bulkDeleteItems
        }
      },
      async handler(req, reply) {
        const type = req.query.type
        const errors: QueryString[] = []
        const validIds:QueryString[] = []

        for (const id of req.body.ids) {
          if ("version" in id)  {
            if (type === "files") {
              validIds.push({ type, ...id})
            } else {
              errors.push({ type, ...id})
            }
          } else {
            if (type === "chats") {
              validIds.push({ type, ...id})
            } else {
              errors.push({ type, ...id} as any)
            }
          }
        }
        const deleteErrors = await deleteFiles(filesystem, validIds)
        reply.send({ ids: errors.concat(deleteErrors) })
      },
    })
  };
}

async function deleteFiles(fileSystem:FilesystemAccessor, ids:QueryString[]):Promise<QueryString[]> {
  const itemsNotDeleted:QueryString[] = []
  for await (const id of ids) {
    const deleted = await fileSystem.deleteFile(parse(id)).catch(() => false)
    if (!deleted) {
      itemsNotDeleted.push(id)
    }
  }
  return itemsNotDeleted;
}