// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance, FastifyRequest} from "fastify";

export function createContext(req: FastifyRequest) {
  return `id=${req.id}, hostname=${req.hostname}, ip=${req.ip} url=${req.url}`
}

export function logRequestReceived(fastify: FastifyInstance, req: FastifyRequest, message: string) {
  fastify.log.info(`[${createContext(req)}] ${message}`)
}

export function logRequestError(fastify: FastifyInstance, req: FastifyRequest, e: Error) {
  fastify.log.error(`[${createContext(req)}] ${e.stack}`)
}