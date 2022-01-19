import tap from "tap";
import {Urls} from "../node/urls";
import { read } from "../node/config/configuration";

tap.test("build default type url", async t => {
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const urls = new Urls(await read())

  const downloadURL = urls.downloadURL({ node, version, type: "drive" });
  t.equal(downloadURL.includes("drive"), true)
  t.equal(downloadURL.includes(node), true)
  t.equal(downloadURL.includes(`${version}`), true)
})

tap.test("build drive download url", async t => {
  const type = "team"
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const urls = new Urls(await read())

  const downloadURL = urls.downloadURL({ type, node });
  t.equal(downloadURL.includes(type), true)
  t.equal(downloadURL.includes(node), true)
  t.equal(downloadURL.includes(`${version}`), true)
})

