// SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
//
// SPDX-License-Identifier: AGPL-3.0-only

import {startupConfiguration, read, STORAGES_CONF} from "../node/config/configuration";
import {describe, it, expect} from 'vitest';

describe('ConfigValidationTest', () => {
  it('config validation', async () => {
    const c = await read();
    expect(c !== undefined).toBe(true);
  })

  it('reject invalid log level', async () => {
    await expect(read( Promise.resolve<any>({
            "bindAddress": "0.0.0.0",
            "path": "/tmp/storages/store",
            "port": 5794,
            "baseURL": "",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": 42,
              "filename": "storages-ce-%DATE%.log",
              "dirname": "/tmp/storages/logs",
              "zippedArchive": true
            }
          }))
    ).rejects.toThrow()
  })

  it('reject missing non existing certpath', async () => {
    await expect(read( Promise.resolve({
            "bindAddress": "0.0.0.0",
            "path": "/tmp/storages/store",
            "port": 5794,
            "baseURL": "",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": "debug",
              "filename": "storages-%DATE%.log",
              "dirname": "/tmp/storages/logs",
              "zippedArchive": true
            },
            "https": {
              "keyPath": "./bla.json",
              "certPath": "./bla.json"
            }
        }))
    ).rejects.toThrow()
  })

  it('custom logging dirname', async () => {
    const c = {
      "STORAGES_LOGGING_DIRNAME": 'bla'
    };

    const configuration = await startupConfiguration(c);

    expect(configuration.logging?.dirname).toBe('bla');
  });

  it('expect error if custom Aws conf incomplete', async () => {
    const c = {
      [STORAGES_CONF.AUTH.AWS4_ACCESS_KEY]: 'bla'
    };
    await expect(startupConfiguration(c)).rejects.toThrow()
  })

  it('custom Aws conf valid', async () => {
    const c = {
      [STORAGES_CONF.AUTH.AWS4_ACCESS_KEY]: 'bla',
      [STORAGES_CONF.AUTH.AWS4_ACCESS_SECRET]: 'bla'
    };

    const configuration = await startupConfiguration(c);

    expect(configuration).not.toBeNull();
  })
})
