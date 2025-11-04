import {Identifier} from "./Identifier";
import {NodeQueryString} from "../routes/types";
import {PathLike} from "fs";

export class NodeIdentifier implements Identifier{
  constructor(private readonly query: NodeQueryString) {
  }

  toFilename(): string {
    return this.query.node;
  }

  path(): PathLike {
    return this.query.node;
  }
}