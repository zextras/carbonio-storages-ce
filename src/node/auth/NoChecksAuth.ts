import {FastifyInstance, FastifyRequest} from "fastify";
import {Auth} from "./Auth";

export class NoChecksAuth implements Auth {
  async check(server: FastifyInstance, request: FastifyRequest): Promise<void> {
    server.log.debug("No auth checks performed on request " + request.id)
  }
}