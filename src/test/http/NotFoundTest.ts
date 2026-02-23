// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest';
import {testApplication, TestServer} from "../TestApplication";
import {Response as LightMyRequestResponse} from "light-my-request";

describe("NotFoundTest", () => {
  async function unknownUrl(app: TestServer): Promise<LightMyRequestResponse> {
    return await app.inject({
      method: "GET",
      url: "test-unknown-url"
    });
  }

  it("not found url", async () => {
    // tslint:disable-next-line: no-empty
    const server = await testApplication()

    const response = await unknownUrl(server);
    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).message).toBe('Not found')
  })
})
