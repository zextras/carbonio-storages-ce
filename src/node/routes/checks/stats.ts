import {FastifyInstance} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";

export const StatsType = Type.Object({
  disk: Type.Object({
    spaceAvailable: Type.Number(),
    freeSpace: Type.Number(),
    percentage: Type.String()
  })
})

export type Stats = Static<typeof StatsType>

export default function(filesystem: FilesystemAccessor): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{ Reply: Stats }>({
      method: "GET",
      url: "/stats",
      schema: {
        tags: ['checks'],
        description: 'Returns statistics on the Slimstore server memory usage.',
        response: {
          200: StatsType
        }
      },
      handler: async function (__, reply) {
        const spaceAvailable: number = await filesystem.availableSpace()
        const freeSpace: number = await filesystem.freeSpace()
        reply.send({
          "disk": {
            "spaceAvailable": spaceAvailable,
            "freeSpace": freeSpace,
            "percentage": ((freeSpace/spaceAvailable)*100).toFixed(3)
          }
        })
      },
    })
  };
}