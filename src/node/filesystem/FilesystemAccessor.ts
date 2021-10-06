import {Identifier} from "./Identifier";
import {Readable, Writable} from "stream";

export interface FilesystemAccessor {
  fileExists(identifier: Identifier): Promise<boolean>;

  openReadStream(identifier: Identifier): Promise<Readable>;

  openWriterStream(identifier: Identifier, overwrite: boolean): Promise<Writable>;

  deleteFile(identifier: Identifier): Promise<boolean>;

  freeSpace(): Promise<number>

  availableSpace(): Promise<number>

  fileIdentifier(identifier: Identifier): string
}