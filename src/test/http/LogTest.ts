// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap"
import {testApplication} from "../TestApplication";
import {Response as LightMyRequestResponse} from "light-my-request";
import { DefaultFastifyInstance } from "../../node/app";

tap.test("get config", async t => {
  const server = await testApplication(t)
  const response = await server.inject({
    method: "GET",
    url: "config"
  });
  t.equal(200, response.statusCode)
})

function getLogLevelURL() {
  return `loglevel`
}

function setLogLevelURL(level: string) {
  return `loglevel?level=${level}`
}

export async function getLogLevel(app: DefaultFastifyInstance): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: getLogLevelURL()
  });
}

export async function setLogLevel(app: DefaultFastifyInstance, level: string): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "PUT",
    url: setLogLevelURL(level)
  });
}

tap.test("set & get log level", async t => {
  const server = await testApplication(t, {logging: {defaultLevel: "debug"}})

  const setLogLevelResponse = await setLogLevel(server, 'error');
  t.equal(200, setLogLevelResponse.statusCode)

  const getLogLevelResponse = await getLogLevel(server);
  t.equal(200, getLogLevelResponse.statusCode)
  t.equal('error', JSON.parse(getLogLevelResponse.body).level)
})

tap.test("set wrong log level", async t => {
  const server = await testApplication(t, {logging: {defaultLevel: "debug"}})

  const setLogLevelResponse = await setLogLevel(server, 'fischi');
  t.equal(400, setLogLevelResponse.statusCode)
})