import tap from "tap"
import config from "../node/config/config.json"
import {createApp} from "../node/app"

export type Test = InstanceType<typeof tap.Test>

async function testApplication(t:Test) {
  const server = await createApp(config)
  t.teardown(async () => {
    await server.close()
  })
  return server
}

tap.test("server test", async t => {

  const server = await testApplication(t)
  
  t.test("liveness check", async t => {
    const response = await server.inject({
      method: "GET",
      url: "slimstore/livenesscheck"
    });  
    t.equal(200, response.statusCode)
  })

})