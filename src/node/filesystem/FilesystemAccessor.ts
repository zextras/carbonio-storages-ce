// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

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