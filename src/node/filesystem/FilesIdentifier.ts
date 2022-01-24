import {FilesQueryString} from "../routes/types";
import {PathLike} from "fs";
import {Identifier} from "./Identifier";
import path from "path"

export class FilesIdentifier implements Identifier{
  constructor(private readonly queryString: FilesQueryString) {
  }

  toFilename(): string {
    return this.queryString.node + "-" + this.queryString.version;
  }

  path(): PathLike {
    return path.join("blobs", this.queryString.node.substring(0,2));
  }
}