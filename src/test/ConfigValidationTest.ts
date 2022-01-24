import {startupConfiguration, read, SLIMSTORE_CONF} from "../node/config/configuration";
import tap                            from "tap";

tap.test('config validation', async t => {
    const c = await read();
    t.equal(c !== undefined, true);
})

tap.test('reject invalid log level', async t => {
    await t.rejects(read( Promise.resolve<any>({
            "bindAddress": "0.0.0.0",
            "path": "/tmp/storages/store",
            "port": 5794,
            "baseURL": "",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": 42,
              "datePattern": "YYYY-MM-DD",
              "filename": "slimstore-%DATE%.log",
              "dirname": "/tmp/storages/logs",
              "zippedArchive": true
            }
          }))
    );
})

tap.test('reject missing non existing certpath', async t => {
  await t.rejects(read( Promise.resolve({
            "bindAddress": "0.0.0.0",
            "path": "/tmp/storages/store",
            "port": 5794,
            "baseURL": "slimstore",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": "debug",
              "datePattern": "YYYY-MM-DD",
              "filename": "storages-%DATE%.log",
              "dirname": "/tmp/storages/logs",
              "zippedArchive": true
            },
            "https": {
              "keyPath": "./bla.json",
              "certPath": "./bla.json"
            }
        }))
    );
})

tap.test('custom logging dirname', async t => {
  const c = {
    "SLIMSTORE_LOGGING_DIRNAME": 'bla'
  };

  const configuration = await startupConfiguration(c);

  t.equal(configuration.logging.dirname, 'bla');
});

tap.test('expect error if custom Aws conf incomplete', async t => {
  const c = {
    [SLIMSTORE_CONF.AUTH.AWS4_ACCESS_KEY]: 'bla'
  };
  await startupConfiguration(c).then(() => t.fail("config is valid")).catch(() => {});
})

tap.test('custom Aws conf valid', async t => {
  const c = {
    [SLIMSTORE_CONF.AUTH.AWS4_ACCESS_KEY]: 'bla',
    [SLIMSTORE_CONF.AUTH.AWS4_ACCESS_SECRET]: 'bla'
  };

  const configuration = await startupConfiguration(c);

  t.not(configuration, null);
})
