// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {PathLike} from "fs";
import {QueryString} from "../routes/types";
import {FilesIdentifier} from "./FilesIdentifier";
import {ChatsIdentifier} from "./ChatsIdentifier";
import {NodeIdentifier} from "./NodeIdentifier";

export interface Identifier {
  path(): PathLike
  toFilename(): string
}

export function parse(queryString: QueryString): Identifier {
  switch (queryString.type) {
    case "node":
      return new NodeIdentifier(queryString)
    case "files":
      return new FilesIdentifier(queryString)
    case "chats":
      return new ChatsIdentifier(queryString)
  }
}

export function parseQueryString(type:QueryString["type"], node:string, version:undefined | number):undefined | QueryString {
  if (version !== undefined) {
    return {
      type,
      node,
      version
    }
  } else if (version === undefined && type=== "chats") {
    return {
      type,
      node
    }
  } else {
    return undefined;
  }
}
