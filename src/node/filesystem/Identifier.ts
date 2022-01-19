import {PathLike} from "fs";
import {QueryString} from "../routes/types";
import {DriveIdentifier} from "./DriveIdentifier";
import { TeamIdentifier } from "./TeamIdentifier";

export interface Identifier {
  path(): PathLike
  toFilename(): string
}

export function parse(queryString: QueryString): Identifier {
  switch (queryString.type) {
    case "drive":
      return new DriveIdentifier(queryString)
    case "team":
      return new TeamIdentifier(queryString)
  }
}
