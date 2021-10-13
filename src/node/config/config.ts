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
  },
  https?: {
    keyPath: string,
    certPath: string
  }
}

export function read(): Config {
  return configuration
}