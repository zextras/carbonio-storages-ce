import {Identifier} from "./Identifier";
import {MailboxMessageQueryString} from "../routes/types";
import {PathLike} from "fs";

export class MailboxMessageIdentifier implements Identifier{
  constructor(private readonly query: MailboxMessageQueryString) {
  }

  toFilename(): string {
    return this.query.accountId + "-" + this.query.itemId + "-" + this.query.revision;
  }

  path(): PathLike {
    return this.query.node + "/" + this.toFilename();
  }
}