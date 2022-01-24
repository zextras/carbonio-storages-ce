// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {ChatsQueryString} from "../routes/types";
import {PathLike} from "fs";
import {Identifier} from "./Identifier";
import path from "path"

export class ChatsIdentifier implements Identifier{
  constructor(private readonly queryString: ChatsQueryString) {
  }

  toFilename(): string {
    return this.queryString.node + "-0";
  }

  path(): PathLike {
    return path.join("blobs", this.queryString.node.substring(0,2));
  }
}