// SPDX-FileCopyrightText: 2022 2021 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {PathLike} from "fs";
import {QueryString} from "../routes/types";
import {FilesIdentifier} from "./FilesIdentifier";
import {ChatsIdentifier} from "./ChatsIdentifier";

export interface Identifier {
  path(): PathLike
  toFilename(): string
}

export function parse(queryString: QueryString): Identifier {
  switch (queryString.type) {
    case "files":
      return new FilesIdentifier(queryString)
    case "chats":
      return new ChatsIdentifier(queryString)
  }
}
