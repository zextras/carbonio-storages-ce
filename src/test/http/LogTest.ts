// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest'
import {mkTempFolder, testApplication, TestServer} from "../TestApplication";
import {Response as LightMyRequestResponse} from "light-my-request";

describe("LogTest", () => {
  it("get config", async () => {
    // tslint:disable-next-line: no-empty
    const server = await testApplication()
    const response = await server.inject({
      method: "GET",
      url: "config"
    });
    expect(response.statusCode).toBe(200)
  })

  async function getLogLevel(app: TestServer): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: "GET",
      url: `loglevel`
    });
  }

  async function setLogLevel(app: TestServer, level: string): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: "PUT",
      url: `loglevel?level=${level}`
    });
  }

  it("set & get log level", async () => {
    const testDirLog: string = await mkTempFolder("storagesCETestsLog");
    // tslint:disable-next-line: no-empty
    const server = await testApplication({
      logging: {
        filename:"carbonio-storages-%DATE%.log",
        defaultLevel: "debug",
        dirname: `${testDirLog}/logs`
      }
    })

    const setLogLevelResponse = await setLogLevel(server, 'error');
    expect(setLogLevelResponse.statusCode).toBe(200)

    const getLogLevelResponse = await getLogLevel(server);
    expect(getLogLevelResponse.statusCode).toBe(200)
    expect(JSON.parse(getLogLevelResponse.body).level).toBe('error')
  })

  it("set wrong log level", async () => {
    const testDirLog: string = await mkTempFolder("storagesCETestsLog");
    // tslint:disable-next-line: no-empty
    const server = await testApplication({
      logging: {
        filename:"carbonio-storages-%DATE%.log",
        defaultLevel: "debug",
        dirname: `${testDirLog}/logs`
      }
    })

    const setLogLevelResponse = await setLogLevel(server, 'fischi');
    expect(setLogLevelResponse.statusCode).toBe(400)
  })
})
