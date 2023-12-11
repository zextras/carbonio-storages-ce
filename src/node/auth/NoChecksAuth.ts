// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Auth} from "./Auth";
import { DefaultFastifyInstance } from "../app";
import { FastifyRequest } from "fastify";

export class NoChecksAuth implements Auth {
  async check(server: DefaultFastifyInstance, request: FastifyRequest): Promise<void> {
    server.log.debug("No auth checks performed on request " + request.id)
  }
}