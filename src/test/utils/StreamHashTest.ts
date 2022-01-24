// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

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