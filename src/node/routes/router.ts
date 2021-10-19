import {FastifyInstance} from "fastify";
import {Config} from "../config/configuration";
import livenessCheck from "./checks/livenesscheck";
import stats from "./checks/stats";
import updatesinglefile from "./filestore/updatesinglefile"
import getsinglefile from "./filestore/getsinglefile"
import deletesinglefile from "./filestore/deletesinglefile";
import {FilesystemAccessor} from "../filesystem/FilesystemAccessor";
import {Urls} from "../urls";
import getloglevel from "./config/getloglevel";
import {LoggerTransports} from "../LoggerTransports";
import setloglevel from "./config/setloglevel";
import getconfig from "./config/getconfig";
import createsinglefile from "./filestore/createsinglefile";

export default function (config: Config, filesystem: FilesystemAccessor, transports: LoggerTransports) : (fastify : FastifyInstance) => Promise<void> {
  return async fastify => {
    const base = { prefix: config.baseURL.length == 0 ? "" : "/" + config.baseURL }
    await fastify.register(livenessCheck, base);
    await fastify.register(stats(filesystem), base);

    await fastify.register(updatesinglefile(filesystem, new Urls(config)), base);
    await fastify.register(createsinglefile(filesystem, new Urls(config)), base);
    await fastify.register(getsinglefile(filesystem), base);
    await fastify.register(deletesinglefile(filesystem), base);

    await fastify.register(getconfig(config), base);
    await fastify.register(getloglevel(transports), base);
    await fastify.register(setloglevel(transports), base);
  }
}