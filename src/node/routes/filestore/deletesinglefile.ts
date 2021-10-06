import {FastifyInstance} from "fastify";
import {QueryString, QueryStringType} from "../types";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Identifier, parse} from "../../filesystem/Identifier";

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: QueryString}>({
      method: "DELETE",
      url: "/delete",
      schema: {
        tags: ['filestore'],
        description: 'Deletes from Slimstore Drive node described by node-id and version passed as query string parameters',
        querystring: QueryStringType
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