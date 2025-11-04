import {Identifier} from "./Identifier";
import {PathLike} from "fs";
import {MailboxIncomingMessageQueryString} from "../routes/types";

export class MailboxIncomingMessageIdentifier implements Identifier{
  constructor(private readonly query: MailboxIncomingMessageQueryString) {
  }

  toFilename(): string {
      return this.query.node;
    }

  path(): PathLike {
    return this.query.node;
  }
}