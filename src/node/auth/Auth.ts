import {FastifyInstance} from "fastify";
import {FastifyRequest} from "fastify/types/request";

export interface Auth {
  check(server: FastifyInstance, request: FastifyRequest): Promise<void>
}