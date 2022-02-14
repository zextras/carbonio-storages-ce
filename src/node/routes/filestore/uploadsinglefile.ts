// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FastifyInstance } from "fastify";
import "fastify-multipart";
import { Static, Type } from "@sinclair/typebox";
import {ErrorType, QueryString, UploadResponseType} from "../types";
import { FilesystemAccessor } from "../../filesystem/FilesystemAccessor";
import { Identifier, parse } from "../../filesystem/Identifier";
import { Urls } from "../../urls";
import StreamHash from "../../filesystem/utils/StreamHash";
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline)

const ResponseType = Type.Union([UploadResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function (filesystem: FilesystemAccessor, urls: Urls): (fastify: FastifyInstance) => FastifyInstance {
	return fastify => {
		return fastify.route<{ Querystring: QueryString, Reply: Response }>({
			method: ["POST", "PUT"],
			url: "/upload",
			schema: {
				tags: ['filestore'],
				description: 'Creates a resource node (if not existent) using the node-id and version passed as query string parameters and the ',
				querystring: {
					type: 'object',
					required: ['type', 'node'],
					additionalProperties: false,
					properties: {
						type: {
							type: "string",
							enum: ["files", "chats"],
						},
						node : {
							type: 'string',
							format: 'uuid'
						},
						version : {
							type: 'number'
						}
					}
				},
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