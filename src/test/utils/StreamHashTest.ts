// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {describe, it, expect} from 'vitest';
import StreamHash from "../../node/filesystem/utils/StreamHash";
import * as fs from "fs";
import { streamToString } from "../http/FilestoreTest";

describe("StreamHashTest", () => {
  it('MD5 hash', async () => {
    const hashTransform = new StreamHash();
    const stream: StreamHash = fs.createReadStream('src/test/resources/file.txt').
      pipe(hashTransform);
    await streamToString(stream);

    expect(hashTransform.computedHash()).toBe('4f5937de8e24e473df43503273b78e6e')
  })
})
