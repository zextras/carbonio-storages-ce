import read1 from "../node/config/config";
import tap from "tap";

tap.test('config validation', async t => {
    const c = read1();
    t.equal(c !== undefined, true);
})