import {Config} from "../config/configuration";
import {Auth} from "./Auth";
import {NoChecksAuth} from "./NoChecksAuth";
import {AWSV4SignatureAuth} from "./AWSV4SignatureAuth";

export class AuthFactory {
  static create(config: Partial<Config>): Auth {
    if (config.awsv4signature) {
      const credentials: any = config.awsv4signature
      if (Object.keys(credentials).length > 0) {
        return new AWSV4SignatureAuth(credentials)
      }
    }

    // default no checks performed
    return new NoChecksAuth()
  }
}