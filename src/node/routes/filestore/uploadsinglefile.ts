import { FastifyInstance } from "fastify";
import "fastify-multipart";
import { Static, Type } from "@sinclair/typebox";
import { ErrorType, QueryString, QueryStringType } from "../types";
import { FilesystemAccessor } from "../../filesystem/FilesystemAccessor";
import { Identifier, parse } from "../../filesystem/Identifier";
import { Urls } from "../../urls";
import StreamHash from "../../filesystem/utils/StreamHash";

const util = require('util')
const {pipeline} = require('stream')
const pump = util.promisify(pipeline)

const UploadResponseType = Type.Object({
	query: Type.Object({}, {additionalProperties: true}),
	resource: Type.String(),
	size: Type.Number(),
	digest: Type.String(),
	digest_algorithm: Type.String()
})
const ResponseType = Type.Union([UploadResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function (filesystem: FilesystemAccessor, urls: Urls): (fastify: FastifyInstance) => FastifyInstance {
	return fastify => {
		return fastify.route<{ Querystring: QueryString, Reply: Response }>({
			method: ["POST", "PUT"],
			url: "/upload",
			schema: {
				tags: ['filestore'],
				description: 'Creates a Drive resource node (if not existent) using the node-id and version passed as query string parameters and the ',
				querystring: QueryStringType,
				consumes: ['multipart/form-data'],
				response: {
					200: UploadResponseType,
          409: ErrorType,
					500: ErrorType
				}
			},
			handler: async function (req, reply) {
				const identifier: Identifier = parse(req.query)

				if (await filesystem.fileExists(identifier) && req.method === 'POST') {
					reply.code(409).send({
						statusCode: 409,
						error: 'Conflict',
						message: `Identifier ${JSON.stringify(identifier)} already exists`
					})
				} else {
					const data = await req.file()
					const hashTransform = new StreamHash();

					hashTransform.pipe(await filesystem.openWriterStream(identifier, true))

					await pump(data.file, hashTransform);

					reply.send({
						query: req.query,
						resource: urls.downloadURL(req.query),
						digest_algorithm: hashTransform.algo,
						size: hashTransform.byteCount,
						digest: hashTransform.computedHash()
					})
				}
			},
		})
	};
}