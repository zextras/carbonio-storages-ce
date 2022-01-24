// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Identifier} from "./Identifier";
import {FilesystemAccessor} from "./FilesystemAccessor";
import {Readable, Writable} from "stream";
import * as zlib from "zlib";


export class GzipWrapperFilesystemAccessor implements FilesystemAccessor {

  constructor(readonly filesystem: FilesystemAccessor) {}

  fileExists(identifier: Identifier): Promise<boolean> {
    return this.filesystem.fileExists(identifier)
  }

  async openReadStream(identifier: Identifier): Promise<Readable> {
    const readable = await this.filesystem.openReadStream(identifier);
    const gunzip = zlib.createGunzip();
    readable.pipe(gunzip)
    return gunzip
  }

  async openWriterStream(identifier: Identifier, overwrite: boolean = true): Promise<Writable> {
    const writable = await this.filesystem.openWriterStream(identifier, overwrite);
    const gzip = zlib.createGzip();
    gzip.pipe(writable)
    return gzip
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