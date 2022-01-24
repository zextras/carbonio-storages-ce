// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap";
import {parse} from "../node/filesystem/Identifier";

tap.test("parse files identifier", async t => {
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const identifier = parse({ node, version, type: "files" });

  t.equal(identifier.toFilename(), node + "-" + version)
  t.equal(identifier.path(), `blobs/${node.substring(0,2)}`)
})

tap.test("parse chats identifier", async t => {
  const type = "chats"
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"

  const identifier = parse({ type, node });

  t.equal(identifier.toFilename(), node + "-0")
  t.equal(identifier.path(), `blobs/${node.substring(0,2)}`)
})