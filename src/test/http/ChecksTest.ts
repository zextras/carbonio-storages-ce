// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap"
import { testApplication } from "../TestApplication";

tap.test("liveness check", async t => {
  const server = await testApplication(t)
  const response = await server.inject({
    method: "GET",
    url: "health/live"
  });
  t.equal(200, response.statusCode)
})

tap.test("stats check", async t => {
  const server = await testApplication(t)
  const response = await server.inject({
    method: "GET",
    url: "stats"
  });
  t.equal(200, response.statusCode)
})