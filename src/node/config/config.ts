import configuration from "./config.json"

export type Config = {
  path: string,
  port: number,
  baseURL: string,
  servingURLPrefix: string,
  compress: boolean,
  logging: {
    defaultLevel: string,
    datePattern: string,
    zippedArchive?: boolean,
    filename: string,
    dirname?: string
  }
}

export function read(): Config {
  return configuration
}