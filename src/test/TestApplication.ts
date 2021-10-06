import tap from "tap"

import config from "../node/config/config.json"
import {createApp} from "../node/app"

export type Test = InstanceType<typeof tap.Test>

export async function testApplication(t:Test) {
  const server = createApp(config)
  t.teardown(async () => {
    await server.close()
  })
  return server
}
