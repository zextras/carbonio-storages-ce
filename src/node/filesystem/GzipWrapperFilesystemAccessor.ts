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
    return this.filesystem.openReadStream(identifier)//(await this.filesystem.openReadStream(identifier)).pipe(createDeflate()).pipe(new ReadStream())
  }

  async openWriterStream(identifier: Identifier, overwrite: boolean = true): Promise<Writable> {
    console.log("compress")
    let writable = await this.filesystem.openWriterStream(identifier, overwrite);
    let gzip = zlib.createGzip();
    return gzip.pipe(writable)
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