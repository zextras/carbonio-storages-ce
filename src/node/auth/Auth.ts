// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance} from "fastify";
import {FastifyRequest} from "fastify/types/request";

export interface Auth {
  check(server: FastifyInstance, request: FastifyRequest): Promise<void>
}