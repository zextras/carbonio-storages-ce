import tap from "tap";
import {testApplication} from "../TestApplication";
import {FastifyInstance} from "fastify";
import {Response as LightMyRequestResponse} from "light-my-request";

export async function unknownUrl(app: FastifyInstance): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: "test-unknown-url"
  });
}

tap.test("not found url", async t => {
  const server = await testApplication(t)

  const response = await unknownUrl(server);
  t.equal(response.statusCode, 404)
  t.equal(JSON.parse(response.body).message, 'Not found')
})