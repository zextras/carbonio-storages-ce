import {FastifyInstance} from "fastify";
import {ErrorType, QueryString, QueryStringType} from "../types";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Static, Type} from "@sinclair/typebox";
import {Identifier, parse} from "../../filesystem/Identifier";

const DownloadResponseType = Type.Any() // how to describe readstream?

const ResponseType = Type.Union([DownloadResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: QueryString, Reply: Response}>({
      method: "GET",
      url: "/download",
      schema: {
        tags: ['filestore'],
        description: 'Downloads from Slimstore Drive node described by node-id and version passed as query string parameters',
        querystring: QueryStringType,
        response: {
          200: ResponseType,
          404: ErrorType,
        }
      },
      handler: async function (req, reply) {
        const identifier: Identifier = parse(req.query)
        const fileName = identifier.toFilename();

        console.log(identifier)

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
          .send(await filesystem.openReadStream(identifier))
        }
      },
    })
  };
}