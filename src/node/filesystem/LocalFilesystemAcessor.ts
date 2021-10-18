import * as fs from 'fs';
import {PathLike} from 'fs';
import {Identifier} from "./Identifier";
import {Config} from "../config/configuration";
import * as path from "path";
import {FilesystemAccessor} from "./FilesystemAccessor";
import {FilePathStrategy} from "./FilePathStategy";
import checkDiskSpace from 'check-disk-space';

export class LocalFilesystemAccessor implements FilesystemAccessor {

  constructor(readonly config: Config, readonly pathStrategy: FilePathStrategy) {}

  private static async exists (path: PathLike): Promise<boolean> {
    try {
      await fs.promises.access(path)
      return true
    } catch (e) {
      return false
    }
  }

  fileExists(identifier: Identifier): Promise<boolean> {
    return LocalFilesystemAccessor.exists(this.calculateFilePath(identifier))
  }

  async openReadStream(identifier: Identifier): Promise<fs.ReadStream> {
    return fs.createReadStream(this.calculateFilePath(identifier))
  }

  async openWriterStream(identifier: Identifier, overwrite: boolean = true): Promise<fs.WriteStream> {
    const parent: PathLike = this.calculateFileParent(identifier);
    if (!await LocalFilesystemAccessor.exists(parent)) {
      await fs.promises.mkdir(parent, {recursive: true})
    } else if (overwrite && await this.fileExists(identifier)) {
      await this.deleteFile(identifier)
    }
    return fs.createWriteStream(this.calculateFilePath(identifier))
  }

  async deleteFile(identifier: Identifier): Promise<boolean> {
    if (await this.fileExists(identifier)) {
      await fs.promises.unlink(this.calculateFilePath(identifier))
      return true
    }
    return false
  }

  private calculateFileParent(identifier: Identifier): string {
    return path.join(this.config.path, identifier.path().toString())
  }

  calculateFilePath(identifier: Identifier): PathLike {
    return path.join(this.calculateFileParent(identifier), identifier.toFilename())
  }

  async availableSpace() : Promise<number> {
    const diskSpace = await checkDiskSpace(this.config.path);
    return diskSpace.size
  }

  async freeSpace() : Promise<number> {
    const diskSpace = await checkDiskSpace(this.config.path);
    return diskSpace.free
  }

  fileIdentifier(identifier: Identifier): string {
    return this.pathStrategy.calculateFilePath(identifier).toString()
  }
}