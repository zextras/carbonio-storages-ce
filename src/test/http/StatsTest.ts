import tap from "tap"
import { testApplication } from "../TestApplication";

tap.test("liveness check", async t => {
  const server = await testApplication(t)
  const response = await server.inject({
    method: "GET",
    url: "slimstore/stats"
  });  
  t.equal(200, response.statusCode)
  const body = JSON.parse(response.body)
  console.log(JSON.stringify(body, null, 2))
})