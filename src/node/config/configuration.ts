// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fs from "fs";
import { LogLevelType } from "../routes/types";
import { mergeDeep, DeepPartial } from "../utils/mergeDeep";

const LoggingOptionsType = Type.Object({
  defaultLevel: LogLevelType,
  zippedArchive: Type.Optional(Type.Boolean()),
  filename: Type.String(),
  dirname: Type.Optional(Type.String())
})

export type LoggingOptions = Static<typeof LoggingOptionsType>

const ConfigType = Type.Object({
  bindAddress: Type.String(),
  path: Type.String(),
  port: Type.Number(),
  baseURL: Type.String(),
  servingURLPrefix: Type.String(),
  compress: Type.Boolean(),
  logging: Type.Optional(LoggingOptionsType),
  https: Type.Optional(Type.Object({
    keyPath: Type.String(),
    certPath: Type.String()
  }))
})

export type Config = Static<typeof ConfigType>

export const STORAGES_CONF = {
  CONF_PATH: "STORAGES_CONF_PATH",
  BIND_ADDRESS: "STORAGES_BIND_ADDRESS",
  PATH: "STORAGES_PATH",
  PORT: "STORAGES_PORT",
  BASE_URL: "STORAGES_BASE_URL",
  LOGGING: {
    DIRNAME: "STORAGES_LOGGING_DIRNAME"
  },
  HTTPS: {
    KEY_PATH: "STORAGES_HTTPS_KEY_PATH",
    CERT_PATH: "STORAGES_HTTPS_CERT_PATH"
  }
}

const loadEnvironmentConf = (conf: Record<string,string|undefined> = process.env) : DeepPartial<Config> => {
  const port = conf[STORAGES_CONF.PORT];

  const result: DeepPartial<Config> = {}

  // tslint:disable-next-line:triple-equals
  if (conf[STORAGES_CONF.BIND_ADDRESS] != undefined)
    result.bindAddress = conf[STORAGES_CONF.BIND_ADDRESS]

  // tslint:disable-next-line:triple-equals
  if (conf[STORAGES_CONF.PATH] != undefined)
    result.path = conf[STORAGES_CONF.PATH]

  // tslint:disable-next-line:triple-equals
  if (port != undefined)
    result.port = parseInt(port, 10);

  // tslint:disable-next-line:triple-equals
  if (conf[STORAGES_CONF.BASE_URL] != undefined)
    result.baseURL = conf[STORAGES_CONF.BASE_URL]

  // tslint:disable-next-line:triple-equals
  if (conf[STORAGES_CONF.LOGGING.DIRNAME] != undefined)
    result.logging = {dirname: conf[STORAGES_CONF.LOGGING.DIRNAME]}

  // tslint:disable-next-line:triple-equals
  if (conf[STORAGES_CONF.HTTPS.KEY_PATH] != undefined &&
  // tslint:disable-next-line:triple-equals
      conf[STORAGES_CONF.HTTPS.CERT_PATH] != undefined) {
    result.https = {
      keyPath: conf[STORAGES_CONF.HTTPS.KEY_PATH],
      certPath: conf[STORAGES_CONF.HTTPS.CERT_PATH]
    }
  }

  return result;
}

export async function startupConfiguration(conf: Record<string,string|undefined> = process.env): Promise<Config> {
  const configPath = conf[STORAGES_CONF.CONF_PATH];
  return mergeDeep(
      await import(configPath !== undefined ? configPath : './config.json')
        .then(({default: startupConfig}) => startupConfig),
      loadEnvironmentConf(conf)
  );
}

export async function read( startupConf: Promise<Config> = startupConfiguration() ): Promise<Config> {
  const validator = new Ajv();

  const config:Config = await startupConf

  await validator.validate(ConfigType, config);

  // tslint:disable-next-line:triple-equals
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