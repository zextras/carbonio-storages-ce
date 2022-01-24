// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {FastifyInstance, FastifyRequest} from "fastify";
import {Auth} from "./Auth";

export class NoChecksAuth implements Auth {
  async check(server: FastifyInstance, request: FastifyRequest): Promise<void> {
    server.log.debug("No auth checks performed on request " + request.id)
  }
}