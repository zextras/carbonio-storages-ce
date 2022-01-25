// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import tap from "tap";
import {Urls} from "../node/urls";
import { read } from "../node/config/configuration";

tap.test("build default type url", async t => {
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const urls = new Urls(await read())

  const downloadURL = urls.downloadURL({ node, version, type: "files" });
  t.equal(downloadURL.includes("files"), true)
  t.equal(downloadURL.includes(node), true)
  t.equal(downloadURL.includes(`${version}`), true)
})

tap.test("build chats download url", async t => {
  const type = "chats"
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const urls = new Urls(await read())

  const downloadURL = urls.downloadURL({ type, node });
  t.equal(downloadURL.includes(type), true)
  t.equal(downloadURL.includes(node), true)
  t.equal(downloadURL.includes(`${version}`), true)
})

