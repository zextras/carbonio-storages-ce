// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest';
import {parse} from "../node/filesystem/Identifier";

describe("IdentifierTest", () => {
  it("parse files identifier", async () => {
    const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
    const version = 1

    const identifier = parse({ node, version, type: "files" });

    expect(identifier.toFilename()).toBe(node + "-" + version)
    expect(identifier.path()).toBe(`blobs/${node.substring(0,2)}`)
  })

  it("parse chats identifier", async () => {
    const type = "chats"
    const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"

    const identifier = parse({ type, node });

    expect(identifier.toFilename()).toBe(node + "-0")
    expect(identifier.path()).toBe(`blobs/${node.substring(0,2)}`)
  })
})
