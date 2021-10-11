import {Config} from "./config/config";
import {QueryString} from "./routes/types";

export class Urls {

  constructor(private readonly config: Config) {
  }

  downloadURL(identifier: QueryString): string {
    return this.config.servingURLPrefix + "/" + this.config.baseURL + "/download" + Urls.buildQueryString(Urls.transform(identifier))
  }

  private static transform(queryString: QueryString): Record<string, string> {
    if (queryString.type === undefined) {
      return {
        ... queryString,
        version: queryString.version.toString(),
        type: "drive"
      }
    } else {
      switch (queryString.type) {
        case "drive":
          return {
            ... queryString,
            version: queryString.version.toString(),
            type: "drive"
          }
        default:
          throw new Error("Unsupported");
      }
    }
  }

  private static buildQueryString(record: Record<string, string>): string {
    const arr: string[] = []

    for (const key in record) {
      arr.push(`${key}=${encodeURIComponent(record[key])}`)
    }

    return "?" + arr.join("&")
  }
}