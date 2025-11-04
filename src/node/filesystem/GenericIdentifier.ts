import {Identifier} from "./Identifier";
import {PathLike} from "fs";
import {GenericQueryString} from "../routes/types";

export class GenericIdentifier implements Identifier{
  constructor(private readonly query: GenericQueryString) {
  }

  toFilename(): string {
      return this.query.node;
    }

  path(): PathLike {
    return this.query.node;
  }
}