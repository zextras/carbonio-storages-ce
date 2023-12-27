// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap";
import {testApplication} from "../TestApplication";
import {Response as LightMyRequestResponse} from "light-my-request";
import { DefaultFastifyInstance } from "../../node/app";

export async function unknownUrl(app: DefaultFastifyInstance): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: "GET",
    url: "test-unknown-url"
  });
}

tap.test("not found url", async t => {
  const server = await testApplication(t)

  const response = await unknownUrl(server);
  t.equal(response.statusCode, 404)
  t.equal(JSON.parse(response.body).message, 'Not found')
})