import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fs from "fs";
import { LogLevelType } from "../routes/types";
import defaultJsonConfiguration from "./config.json";
import { mergeDeep, DeepPartial } from "../utils/mergeDeep";

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

const SLIMSTORE_CONF = {
  PATH: "SLIMSTORE_PATH",
  PORT: "SLIMSTORE_PORT",
  BASE_URL: "SLIMSTORE_BASE_URL",
  LOGGING: {
    DIRNAME: "SLIMSTORE_LOGGING_DIRNAME"
  },
  HTTPS: {
    KEY_PATH: "SLIMSTORE_HTTPS_KEY_PATH",
    CERT_PATH: "SLIMSTORE_HTTPS_CERT_PATH"
  },
  AUTH: {
    AWS4_KEY: "SLIMSTORE_AUTH_AWSV4SIGNATURE_KEY",
    AWS4_VALUE: "SLIMSTORE_AUTH_AWSV4SIGNATURE_VALUE"
  }
}

const awsEnvConf = (conf: any) => {
  const key = conf[SLIMSTORE_CONF.AUTH.AWS4_KEY];
  const value = conf[SLIMSTORE_CONF.AUTH.AWS4_VALUE];

  if (key && value) {
    return {
      [key]: value
    }
  } else if (key == undefined && value == undefined) {
    return undefined
  } else {
    throw new Error(`Aws: Invalid key: ${key} or value: ${value}`)
  }
}

const loadEnvironmentConf = (conf: any = process.env) : DeepPartial<Config> => {
  const port = conf[SLIMSTORE_CONF.PORT];

  const result: DeepPartial<Config> = {}

  if (conf[SLIMSTORE_CONF.PATH] != undefined)
    result.path = conf[SLIMSTORE_CONF.PATH]

  if (port != undefined)
    result.port = parseInt(port);

  if (conf[SLIMSTORE_CONF.BASE_URL] != undefined)
    result.baseURL = conf[SLIMSTORE_CONF.BASE_URL]

  if (conf[SLIMSTORE_CONF.LOGGING.DIRNAME] != undefined)
    result.logging = {dirname: conf[SLIMSTORE_CONF.LOGGING.DIRNAME]}

  if (conf[SLIMSTORE_CONF.HTTPS.KEY_PATH] != undefined &&
      conf[SLIMSTORE_CONF.HTTPS.CERT_PATH] != undefined) {
    result.https = {
      keyPath: conf[SLIMSTORE_CONF.HTTPS.KEY_PATH],
      certPath: conf[SLIMSTORE_CONF.HTTPS.CERT_PATH]
    }
  }

  const extractedAwsConf = awsEnvConf(conf)
  if (extractedAwsConf != undefined)
    result.awsv4signature = extractedAwsConf

  return result;
}

export function defaultConfiguration(conf: any = process.env) {
  return mergeDeep(defaultJsonConfiguration, loadEnvironmentConf(conf));
}

export async function read( configuration: any = defaultConfiguration() ): Promise<Config> {
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