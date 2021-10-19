import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fs from "fs";
import defaultConfiguration from "./config.json";
import { LogLevelType } from "../routes/types";

const ConfigType = Type.Object({
  path: Type.String(),
  port: Type.Number(),
  baseURL: Type.String(),
  servingURLPrefix: Type.String(),
  compress: Type.Boolean(),
  logging: Type.Object({
    defaultLevel: LogLevelType,
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

export type Config = Static<typeof ConfigType>

export async function read( configuration: any = defaultConfiguration ): Promise<Config> {
  const validator = new Ajv();

  await validator.validate(ConfigType, configuration);
    
  if (validator.errors == undefined) {
    if ('https' in configuration) {
      const { keyPath, certPath } = configuration.https;
      await fs.promises.access(keyPath, fs.constants.R_OK)
      await fs.promises.access(certPath, fs.constants.R_OK)
    }
    return configuration as any;
  } else {
    throw new Error(JSON.stringify(validator.errors, null, 2));
  };
}