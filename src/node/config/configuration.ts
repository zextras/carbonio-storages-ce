import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fs from "fs";
import { LogLevelType } from "../routes/types";
import { mergeDeep, DeepPartial } from "../utils/mergeDeep";

const ConfigType = Type.Object({
  bindAddress: Type.String(),
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

export const SLIMSTORE_CONF = {
  CONF_PATH: "SLIMSTORE_CONF_PATH",
  BIND_ADDRESS: "SLIMSTORE_BIND_ADDRESS",
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
    AWS4_ACCESS_KEY: "SLIMSTORE_AUTH_AWSV4SIGNATURE_ACCESS_KEY",
    AWS4_ACCESS_SECRET: "SLIMSTORE_AUTH_AWSV4SIGNATURE_ACCESS_SECRET"
  }
}

const awsEnvConf = (conf: any) => {
  const key = conf[SLIMSTORE_CONF.AUTH.AWS4_ACCESS_KEY];
  const value = conf[SLIMSTORE_CONF.AUTH.AWS4_ACCESS_SECRET];

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

  if (conf[SLIMSTORE_CONF.BIND_ADDRESS] != undefined)
    result.bindAddress = conf[SLIMSTORE_CONF.BIND_ADDRESS]

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

export async function startupConfiguration(conf: any = process.env): Promise<Config> {
  return mergeDeep(
      await import((conf[SLIMSTORE_CONF.CONF_PATH] !== undefined) ? conf[SLIMSTORE_CONF.CONF_PATH] : './config.json')
        .then(({default: startupConfig}) => startupConfig),
      await import('./config.json').then(({default: startupConfig}) => startupConfig as any),
      loadEnvironmentConf(conf)
  );
}

export async function read( startupConf: Promise<Config> = startupConfiguration() ): Promise<Config> {
  const validator = new Ajv();

  const config:Config = await startupConf

  await validator.validate(ConfigType, config);

  if (validator.errors == undefined) {
    if (config.https !== undefined) {
      const { keyPath, certPath } = config.https;
      await fs.promises.access(keyPath, fs.constants.R_OK)
      await fs.promises.access(certPath, fs.constants.R_OK)
    }
    return config;
  } else {
    throw new Error(JSON.stringify(validator.errors, null, 2));
  };
}