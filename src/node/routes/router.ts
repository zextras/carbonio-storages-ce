// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FastifyInstance } from "fastify";
import { Config } from "../config/configuration";
import livenessCheck from "./checks/livenesscheck";
import stats from "./checks/stats";
import getsinglefile from "./filestore/getsinglefile"
import deletesinglefile from "./filestore/deletesinglefile";
import { FilesystemAccessor } from "../filesystem/FilesystemAccessor";
import { Urls } from "../urls";
import getconfig from "./config/getconfig";
import uploadsinglefile from "./filestore/uploadsinglefile";
import copy from "./filestore/copy";
import bulkDelete from "./filestore/bulkDelete"
import { getLogLevel } from "./config/getloglevel";
import { setLogLevel } from "./config/setloglevel";

export default function (config: Config, filesystem: FilesystemAccessor) : (fastify : FastifyInstance) => Promise<void> {
  return async fastify => {
    const base = { prefix: config.baseURL.length === 0 ? "" : "/" + config.baseURL }

    await fastify.register(livenessCheck, base);
    await fastify.register(stats(filesystem), base);

    const urls = new Urls(config);
    await fastify.register(uploadsinglefile(filesystem, urls), base);
    await fastify.register(getsinglefile(filesystem), base);
    await fastify.register(deletesinglefile(filesystem), base);
    await fastify.register(copy(filesystem, urls), base);
    await fastify.register(bulkDelete(filesystem), base);

    await fastify.register(getconfig(config), base);
    await fastify.register(getLogLevel, base);
    await fastify.register(setLogLevel, base);
  }
}
