import config from "../node/config/config.json"
import {createApp} from "../node/app"
import * as fs from "fs";
import {Config} from "../node/config/config";
import {mergeDeep, RecursivePartial, Test} from "./TestUtils";

export async function testApplication(t:Test, configPatch: RecursivePartial<Config> = {}) {

  const defaultTestConfig = {... config}

  const testDir: string = await mkTempFolder("slimstoreTests");
  defaultTestConfig.path = `${testDir}/store`
  defaultTestConfig.logging.dirname = `${testDir}/logs`

  const testConfig: Config = mergeDeep({... defaultTestConfig}, {... configPatch})

  const server = createApp(testConfig)
  t.teardown(async () => {
    await server.close()
    await fs.promises.rm(testDir, {recursive: true})
  })
  return server
}

async function mkTempFolder(prefix:string): Promise<string> {
  const folder = await fs.promises.mkdtemp(`/tmp/${prefix}`)
  await fs.promises.mkdir(folder, { recursive: true });
  return folder;
}