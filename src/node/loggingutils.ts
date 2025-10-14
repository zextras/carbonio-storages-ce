// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FastifyRequest } from "fastify";

export function createContext(req: FastifyRequest) {
  return `id=${req.id}, hostname=${req.hostname}, ip=${req.ip} url=${req.url}`
}