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
