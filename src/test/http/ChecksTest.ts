// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest'
import { testApplication } from "../TestApplication";

describe("ChecksTest", () => {
  it("liveness check", async () => {
    // tslint:disable-next-line: no-empty
    const server = await testApplication({teardown: () => {}})
    const response = await server.inject({
      method: "GET",
      url: "health/live"
    });
    expect(response.statusCode).toBe(200)
  })

  it("stats check", async () => {
    // tslint:disable-next-line: no-empty
    const server = await testApplication({teardown: () => {}})
    const response = await server.inject({
      method: "GET",
      url: "stats"
    });
    expect(response.statusCode).toBe(200)
  })
})
