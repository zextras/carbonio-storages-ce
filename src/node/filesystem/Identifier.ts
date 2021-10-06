import {PathLike} from "fs";
import {QueryString} from "../routes/types";
import {DriveIdentifier} from "./DriveIdentifier";

export interface Identifier {
  path(): PathLike
  toFilename(): string
}

export function parse(queryString: QueryString): Identifier {
  if (queryString.type === undefined) { // default
    return new DriveIdentifier({... queryString, type: "drive"})
  } else {
    switch (queryString.type) {
      case "drive":
        return new DriveIdentifier(queryString)
      case "mail":
        throw new Error("unuspported");
    }
  }
}
