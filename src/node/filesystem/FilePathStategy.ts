// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Identifier} from "./Identifier";
import * as path from "path";
import {PathLike} from "fs";
import {Config} from "../config/configuration";

export interface FilePathStrategy {
  calculateFilePath(identifier: Identifier): PathLike
}

export class LocalPathStrategy implements FilePathStrategy {

  constructor(readonly config: Config) {}

  private calculateFileParent(identifier: Identifier): string {
    return path.join(this.config.path, identifier.path().toString())
  }

  calculateFilePath(identifier: Identifier): PathLike {
    return path.join(this.calculateFileParent(identifier), identifier.toFilename())
  }
}