import {TeamQueryString} from "../routes/types";
import {PathLike} from "fs";
import {Identifier} from "./Identifier";
import path from "path"

export class TeamIdentifier implements Identifier{
  constructor(private readonly queryString: TeamQueryString) {
  }

  toFilename(): string {
    return this.queryString.node;
  }

  path(): PathLike {
    return path.join(this.queryString.type, this.queryString.node.substring(0,2));
  }
}