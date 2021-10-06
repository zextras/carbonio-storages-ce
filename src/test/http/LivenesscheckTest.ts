import tap from "tap"
import { testApplication } from "../TestApplication";

tap.test("liveness check", async t => {
  const server = await testApplication(t)
  const response = await server.inject({
    method: "GET",
    url: "slimstore/livenesscheck"
  });  
  t.equal(200, response.statusCode)
})