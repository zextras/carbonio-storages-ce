import { read } from "../node/config/configuration";
import tap from "tap";

tap.test('config validation', async t => {
    const c = await read();
    t.equal(c !== undefined, true);
})

tap.test('reject invalid log level', async t => {
    t.rejects(read({
            "path": "/tmp/slimstore/store",
            "port": 5794,
            "baseURL": "slimstore",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": 42,
              "datePattern": "YYYY-MM-DD",
              "filename": "slimstore-%DATE%.log",
              "dirname": "/tmp/slimstore/logs",
              "zippedArchive": true
            }
          })
    );
})

tap.test('reject missing non existing certpath', async t => {
    t.rejects(read({
            "path": "/tmp/slimstore/store",
            "port": 5794,
            "baseURL": "slimstore",
            "servingURLPrefix": "http://localhost:5794",
            "compress": false,
            "logging": {
              "defaultLevel": "debug",
              "datePattern": "YYYY-MM-DD",
              "filename": "slimstore-%DATE%.log",
              "dirname": "/tmp/slimstore/logs",
              "zippedArchive": true
            },
            "https": {
              "keyPath": "./package.json",
              "certPath": "./package.json"
            }
          })
    );
})