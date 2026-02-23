// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from "fs";
import { createApp } from "../node/app";
import { Config, read } from "../node/config/configuration";
import { DeepPartial, mergeDeep } from "../node/utils/mergeDeep";
import { FastifyInstance, FastifyTypeProviderDefault, RawServerDefault } from "fastify/fastify";
import { IncomingMessage, ServerResponse } from "http";
import { onTestFinished } from "vitest";

export type TestServer = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, any, FastifyTypeProviderDefault>

export async function testApplication(configPatch: DeepPartial<Config> = {}): Promise<TestServer> {

  const defaultTestConfig: Config = {... await read()}

  delete defaultTestConfig.https

  delete defaultTestConfig.awsv4signature

  const testDir: string = await mkTempFolder("storagesCETests");
  defaultTestConfig.path = `${testDir}/store`

  defaultTestConfig.logging = undefined;

  const testConfig: Config = mergeDeep({... defaultTestConfig}, {... configPatch})

  const server = await createApp(testConfig)
  onTestFinished(async () => {
    await server.close()
    await fs.promises.rm(testDir, {recursive: true})
  })
  return server
}

export async function mkTempFolder(prefix:string): Promise<string> {
  const folder = await fs.promises.mkdtemp(`/tmp/${prefix}`)
  await fs.promises.mkdir(folder, { recursive: true });
  return folder;
}
