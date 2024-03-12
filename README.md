<!--
SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->

<div align="center">
  <h1>Storages-CE</h1>
</div>

<p align="center">
  <a href="https://github.com/zextras/storages-ce/graphs/contributors" alt="Contributors">
  <img src="https://img.shields.io/github/contributors/zextras/storages-ce" /></a>
  <a href="https://github.com/zextras/storages-ce/pulse" alt="Activity">
  <img src="https://img.shields.io/github/commit-activity/m/zextras/storages-ce" /></a>
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

Node 18 is required to build the application, alternatively [nvm](https://github.com/nvm-sh/nvm) may be used:

```sh
$ nvm install
```

<h4>Start the application</h4>

Server can be started using:

`npm run build && npm run start`

Then Storages-CE server will be available at `http://localhost:5794/`

<h3>Docker</h3>

A docker image is available on [Docker Hub](https://hub.docker.com/r/zextras/storages-ce).
To run the application:

`docker run -it --rm -d -p 5794:5794 -e STORAGES_BIND_ADDRESS="0.0.0.0" --name storages-ce zextras/storages-ce`

<h2>Configuration</h2>

The following environment variables can be provided when starting the Storages-CE server

- `STORAGES_CONF_PATH`

The path to the configuration file

- `STORAGES_BIND_ADDRESS`

Address on which Storages-CE will listen for API calls (default 127.0.0.1)

- `STORAGES_PATH`

The folder inside which all file are stored

- `STORAGES_PORT`

The port the Storages-CE is listening for http connections.

- `STORAGES_BASE_URL`

The suffix path at which the Storages-CE is served.
The full url is constructed in the following way:

`(http|https)://0.0.0.0:${STORAGES_PORT}/${STORAGES_BASE_URL}`

- `STORAGES_LOGGING_DIRNAME`

Folder including log files produced by Storages-CE

- `STORAGES_HTTPS_KEY_PATH`
- `STORAGES_HTTPS_CERT_PATH`

Cerificates informations

<h2>Api documentation</h2>

Once the application is started, swagger documentation is available at: `http://localhost:5794/`

<h2>License</h2>

<p>
Storages-CE is released under the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" alt="GNU Affero General Public License">GNU Affero General Public License</a>, see `LICENSE.txt` for further details.
</p>
