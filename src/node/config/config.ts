import configuration from "./config.json";
import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
// import { LogLevelType } from "../routes/types";

// export type Config = {
//   path: string,
//   port: number,
//   baseURL: string,
//   servingURLPrefix: string,
//   compress: boolean,
//   logging: {
//     defaultLevel: string,
//     datePattern: string,
//     zippedArchive?: boolean,
//     filename: string,
//     dirname?: string
//   },
//   https?: {
//     keyPath: string,
//     certPath: string
//   },
//   awsv4signature?: any
// }

export type Config = Static<typeof ConfigType>

const ConfigType = Type.Object({
  path: Type.String(),
  port: Type.Number(),
  baseURL: Type.String(),
  servingURLPrefix: Type.String(),
  compress: Type.Boolean(),
  logging: Type.Object({
    defaultLevel: Type.String(),
    datePattern: Type.String(),
    zippedArchive: Type.Optional(Type.Boolean()),
    filename: Type.String(),
    dirname: Type.Optional(Type.String())
  }),
  https: Type.Optional(Type.Object({
    keyPath: Type.String(),
    certPath: Type.String()
  })),
  awsv4signature: Type.Optional(Type.Object({}, {additionalProperties: true}))
})


export async function read(): Promise<Config> {
  const validator = new Ajv();

  const result = await validator.validate(ConfigType, configuration);
    
  if (result === true) {
    return configuration as any
  } else {
    throw new Error(JSON.stringify(validator.errors, null, 2))
  };
}