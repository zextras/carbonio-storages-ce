// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance, FastifyReply, RawServerBase, RouteGenericInterface} from "fastify";
import {CopyParameters, CopyParametersType, ErrorType} from "../types";
import {FilesystemAccessor} from "../../filesystem/FilesystemAccessor";
import {Static, Type} from "@sinclair/typebox";
import {parse, parseQueryString} from "../../filesystem/Identifier";
import StreamHash from "../../filesystem/utils/StreamHash";
import util from 'util';
import { pipeline } from 'stream';
import { Urls } from "../../urls";
import { IncomingMessage } from "http";
import { Http2ServerRequest } from "http2";

const pump = util.promisify(pipeline)

const StoredBlobResponseType = Type.Object({
	query: Type.Object({}, {additionalProperties: true}),
	resource: Type.String(),
	size: Type.Number(),
	digest: Type.String(),
	digest_algorithm: Type.String()
})

const ResponseType = Type.Union([StoredBlobResponseType, ErrorType])

type Response = Static<typeof ResponseType>

export default function(filesystem: FilesystemAccessor, urls: Urls): (fastify: FastifyInstance) => FastifyInstance {
  return fastify => {
    return fastify.route<{Querystring: CopyParameters, Reply: Response}>({
      method: "PUT",
      url: "/copy",
      schema: {
        tags: ['filestore'],
        description: 'Copy blobs',
        querystring: CopyParametersType,
        response: {
          200: StoredBlobResponseType,
          409: ErrorType,
          500: ErrorType
        },
      },
      handler: async function (req, reply) {
        const sourceQuery = parseQueryString(req.query.type, req.query.sourceNode, req.query.sourceVersion); 
        
        if (sourceQuery === undefined) {
          return replyError(reply, {
            statusCode : 400,
            error : "Bad Request",
            message : `Invalid request ${JSON.stringify(req.query)}`
          })
        } 
        
        const sourceIdentifier = parse(sourceQuery);
        if (!(await filesystem.fileExists(sourceIdentifier))) {
          return replyError(reply, {
            statusCode : 404,
            error : "Not found",
            message : `File '${JSON.stringify(sourceIdentifier)}' does not exist`
          })
        } else {
          const destinationQuery = parseQueryString(req.query.type, req.query.destinationNode, req.query.destinationVersion);
          
          if (destinationQuery === undefined) {
            return replyError(reply, {
              statusCode : 400,
              error : "Bad Request",
              message : `Invalid request ${JSON.stringify(req.query)}`
            })
          }

          const destinationIdentifier = parse(destinationQuery);
          if (destinationIdentifier === undefined) {
            return replyError(reply, {
              statusCode : 400,
              error : "Bad Request",
              message : `Invalid request ${JSON.stringify(req.query)}`
            })
          } else if (!req.query.override && await filesystem.fileExists(destinationIdentifier)) {
            return replyError(reply, {
              statusCode: 409,
              error: 'Conflict',
              message: `Identifier ${JSON.stringify(destinationIdentifier)} already exists`
            })
          } else {
            
            const sourceStream = await filesystem.openReadStream(sourceIdentifier)
            const hashTransform = new StreamHash();

            hashTransform.pipe(await filesystem.openWriterStream(destinationIdentifier, true))

            await pump(sourceStream, hashTransform);

            reply.status(200).send({
              query: destinationQuery,
              resource: urls.downloadURL(destinationQuery),
              digest_algorithm: hashTransform.algo,
              size: hashTransform.byteCount,
              digest: hashTransform.computedHash()
            })
          }
        }
      },
    })
  };
}

type ErrorResponse = {
  statusCode: number,
  error: string,
  message: string
}

function replyError(reply: FastifyReply<RouteGenericInterface, RawServerBase, IncomingMessage | Http2ServerRequest>, errorResponse: ErrorResponse) {
  return reply.status(errorResponse.statusCode)
    .type('application/json')
    .send(errorResponse);
}


