import {Identifier} from "./Identifier";
import {MailboxStagedMessageQueryString} from "../routes/types";
import {PathLike} from "fs";

export class MailboxStagedMessageIdentifier implements Identifier{
  constructor(private readonly query: MailboxStagedMessageQueryString) {
  }

  toFilename(): string {
    return this.query.node;
  }

  path(): PathLike {
    return this.query.node;
  }
}