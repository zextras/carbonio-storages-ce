// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Identifier} from "./Identifier";
import {FilesystemAccessor} from "./FilesystemAccessor";
import {finished, pipeline, Readable, Writable} from "stream";
import * as zlib from "node:zlib";

export class GzipWriter extends Writable {
  private readonly gzip = zlib.createGzip()

  constructor(private readonly inner: Writable) {
    super()
    pipeline(this.gzip, inner, err => {
      if (err) {
        this.destroy(err)
      }
    })
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (this.gzip.write(chunk)) {
      callback()
    } else {
      this.gzip.once('drain', () => callback())
    }
  }

  override _final(callback: (error?: Error | null) => void): void {
    finished(this.inner, err => callback(err))
    this.gzip.end()
  }

  override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    this.gzip.destroy()
    this.inner.destroy()
    callback(error)
  }
}

export class GzipWrapperFilesystemAccessor implements FilesystemAccessor {

  constructor(readonly filesystem: FilesystemAccessor) {}

  fileExists(identifier: Identifier): Promise<boolean> {
    return this.filesystem.fileExists(identifier)
  }

  async openReadStream(identifier: Identifier): Promise<Readable> {
    const readable = await this.filesystem.openReadStream(identifier);
    const gunzip = zlib.createGunzip();
    pipeline(readable, gunzip, () => {})
    return gunzip
  }

  async openWriterStream(identifier: Identifier, overwrite: boolean = true): Promise<Writable> {
    const writable = await this.filesystem.openWriterStream(identifier, overwrite);
    return new GzipWriter(writable)
  }

  async deleteFile(identifier: Identifier): Promise<boolean> {
   return this.filesystem.deleteFile(identifier)
  }

  async availableSpace() : Promise<number> {
    return this.filesystem.availableSpace()
  }

  async freeSpace() : Promise<number> {
    return this.filesystem.freeSpace()
  }

  fileIdentifier(identifier: Identifier): string {
    return this.filesystem.fileIdentifier(identifier)
  }
}