<!--
SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->


<div align="center">
  <h1>Slimstore</h1>
</div>

<p align="center">
  <a href="https://github.com/zextras/slimstore/graphs/contributors" alt="Contributors">
  <img src="https://img.shields.io/github/contributors/zextras/slimstore" /></a>
  <a href="https://github.com/zextras/slimstore/pulse" alt="Activity">
  <img src="https://img.shields.io/github/commit-activity/m/zextras/slimstore" /></a>
  <img src="https://img.shields.io/badge/license-AGPL%203-green" alt="License AGPL 3">
  <img src="https://img.shields.io/badge/project-carbonio-informational" alt="Project Carbonio">
  <a href="https://twitter.com/intent/follow?screen_name=zextras">
  <img src="https://img.shields.io/twitter/follow/zextras?style=social&logo=twitter" alt="Follow on Twitter"></a>
</p>

<p>
  External files store application for [Carbonio CE](https://www.zextras.com/carbonio-community-edition/)
</p>

<h2>Getting started</h2>

<h3>Build the application from source code</h3>

<h4>Prerequisites</h4>

Node 14 is required to build the application, alternativelly [nvm](https://github.com/nvm-sh/nvm) may be used:

```sh
$ nvm install
...
Now using node v14.18.2 (npm v6.14.15)
```

<h4>Start the application</h4>

Server can be started using:

`npm run build && npm run start`

Then slimstore server will be available at `http://localhost:5794/`

<h3>Docker</h3>

A docker image is available on [Docker Hub](https://hub.docker.com/r/zextras/slimstore).
To run the application:

`docker run -it --rm -d -p 5794:5794 --name slimstore zextras/slimstore`

<h2>Configuration</h2>

The following environment variables can be provided when starting the slimstore server

- `SLIMSTORE_CONF_PATH`

The path to the configuration file

- `SLIMSTORE_BIND_ADDRESS`

Address on which Slimstore will listen for API calls (default 127.0.0.1)

- `SLIMSTORE_PATH`


The folder inside which all file are stored

- `SLIMSTORE_PORT`

The port the slimstore is listening for http connections.

- `SLIMSTORE_BASE_URL`

The suffix path at which the slimstore is served.
The full url is constructed in the following way:

`(http|https)://0.0.0.0:${SLIMSTORE_PORT}/${SLIMSTORE_BASE_URL}`

- `SLIMSTORE_LOGGING_DIRNAME`

Folder including log files produced by slimstore

- `SLIMSTORE_HTTPS_KEY_PATH`
- `SLIMSTORE_HTTPS_CERT_PATH`

Cerificates informations

<h2>Api documentation</h2>

Once the application is started, swagger documentation is available at: `http://localhost:5794/`

<h2>License</h2>

<p>
Slimstore is released under the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" alt="GNU Affero General Public License">GNU Affero General Public License</a>, see `LICENSE.txt` for further details.
</p>
