// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Transform, TransformCallback } from "stream";
import crypto, { Hash } from "crypto";

export default class extends Transform{
	public readonly algo: string;
	private readonly hash: Hash;
	public byteCount: number;
	constructor(algo: string = 'md5') {
		super();
		this.algo = algo.toLowerCase();
		this.hash = crypto.createHash(algo);
		this.byteCount = 0;
	}

	_transform(chunk: any, _encoding: BufferEncoding, done: TransformCallback): void {
		this.hash.update(chunk);
		this.byteCount += chunk.length;
		done(null, chunk);
	}

	_flush(done: TransformCallback) {
		done();
	}

	computedHash(): string {
		return this.hash.digest('hex');
	}
}