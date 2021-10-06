import {DriveQueryString} from "../routes/types";
import {PathLike} from "fs";
import {Identifier} from "./Identifier";

export class DriveIdentifier implements Identifier{
  constructor(private readonly queryString: DriveQueryString) {
  }

  toFilename(): string {
    return this.queryString.node + "-" + this.queryString.version;
  }

  path(): PathLike {
    return this.queryString.node.substr(0,2);
  }
}