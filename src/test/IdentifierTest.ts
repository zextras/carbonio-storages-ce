import tap from "tap";
import {parse} from "../node/filesystem/Identifier";

tap.test("parse default identifier type", async t => {
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const identifier = parse({
    node,
    version
  });

  t.equal(identifier.toFilename(), node + "-" + version)
  t.equal(identifier.path(), node.substr(0,2))
})

tap.test("parse drive identifier", async t => {
  const type = "drive"
  const node = "443c815e-6b88-47b1-800f-d74d2d3004bf"
  const version = 1

  const identifier = parse({
    type,
    node,
    version
  });

  t.equal(identifier.toFilename(), node + "-" + version)
  t.equal(identifier.path(), node.substr(0,2))
})