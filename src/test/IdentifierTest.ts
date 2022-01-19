import tap from "tap";
import {parse} from "../node/filesystem/Identifier";

tap.test("parse drive identifier", async t => {
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const identifier = parse({ node, version, type: "drive" });

  t.equal(identifier.toFilename(), node + "-" + version)
  t.equal(identifier.path(), `drive/${node.substring(0,2)}`)
})

tap.test("parse team identifier", async t => {
  const type = "team"
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"

  const identifier = parse({ type, node });

  t.equal(identifier.toFilename(), node)
  t.equal(identifier.path(), `${type}/${node.substring(0,2)}`)
})