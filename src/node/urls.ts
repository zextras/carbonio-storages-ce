// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {Config} from "./config/configuration";
import {QueryString} from "./routes/types";

export class Urls {

  constructor(private readonly config: Config) {
  }

  downloadURL(identifier: QueryString): string {
    return this.config.servingURLPrefix +
        (this.config.baseURL.length == 0 ? "" :  "/" + this.config.baseURL) +
        "/download" + Urls.buildQueryString(Urls.transform(identifier))
  }

  private static transform(queryString: QueryString): Record<string, string> {
    switch (queryString.type) {
      case "files":
        return {
          ... queryString,
          version: queryString.version.toString()
        }
      default:
        return {
          ... queryString
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