import tap from "tap";
import StreamHash from "../../node/filesystem/utils/StreamHash";
import * as fs from "fs";
import { streamToString } from "../http/FilestoreTest";

tap.test('MD5 hash', async t => {
	const hashTransform = new StreamHash();
	const stream: StreamHash = fs.createReadStream('src/test/resources/file.txt').
		pipe(hashTransform);
	await streamToString(stream);

	t.equal(hashTransform.computedHash(),'4f5937de8e24e473df43503273b78e6e')
})