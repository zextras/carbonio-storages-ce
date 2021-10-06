import {FastifyInstance} from "fastify";
import "fastify-multipart";
import {ErrorType, QueryString, QueryStringType} from "../types";
import {Static, Type} from "@sinclair/typebox";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Identifier, parse} from "../../filesystem/Identifier";
import {Urls} from "../../urls";

const util = require('util')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)

const UploadResponseType = Type.Object({
  query: QueryStringType,
  resource: Type.String()
})

const ResponseType = Type.Union([UploadResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function(filesystem: FilesystemAccessor, urls: Urls): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: QueryString, Reply: Response}>({
      method: ["PUT", "POST"],
      url: "/upload",
      schema: {
        tags: ['filestore'],
        description: 'Uploads to Slimstore Drive node using the node-id and version passed as query string parameters and the ',
        consumes: ['multipart/form-data'],
        querystring: QueryStringType,
        response: {
          200: UploadResponseType,
          500: ErrorType
        }
      },
      handler: async function (req, reply) {
        const identifier: Identifier = parse(req.query)

        try {
          const data = await req.file()

          await pump(data.file, await filesystem.openWriterStream(identifier, true))
          reply.send({
            query: req.query,
            resource: urls.downloadURL(req.query)
          })
        } catch (e) {
          reply.send({
            statusCode: 500,
            error: "Internal server error",
            message: (e instanceof Error) ? e.message : "unknown"
          })
        }
      },
    })
  };
}