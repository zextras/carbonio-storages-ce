// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest';
import {Urls} from "../node/urls";
import { read } from "../node/config/configuration";

describe("UrlsTest", () => {
  it("build default type url", async () => {
    const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
    const version = 1

    const urls = new Urls(await read())

    const downloadURL = urls.downloadURL({ node, version, type: "files" });
    expect(downloadURL.includes("files")).toBe(true)
    expect(downloadURL.includes(node)).toBe(true)
    expect(downloadURL.includes(`${version}`)).toBe(true)
  })

  it("build chats download url", async () => {
    const type = "chats"
    const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
    const version = 1

    const urls = new Urls(await read())

    const downloadURL = urls.downloadURL({ type, node });
    expect(downloadURL.includes(type)).toBe(true)
    expect(downloadURL.includes(node)).toBe(true)
    expect(downloadURL.includes(`${version}`)).toBe(true)
  })
})
