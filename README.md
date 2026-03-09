<!--
SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->

<div align="center">
  <h1>Carbonio Storages CE</h1>
</div>

<p align="center">
  <a href="https://github.com/zextras/carbonio-storages-ce/graphs/contributors" alt="Contributors">
  <img src="https://img.shields.io/github/contributors/zextras/carbonio-storages-ce" /></a>
  <a href="https://github.com/zextras/carbonio-storages-ce/pulse" alt="Activity">
  <img src="https://img.shields.io/github/commit-activity/m/zextras/carbonio-storages-ce" /></a>
  <img src="https://img.shields.io/badge/license-AGPL%203-green" alt="License AGPL 3">
  <img src="https://img.shields.io/badge/project-carbonio-informational" alt="Project Carbonio">
</p>

External files storage service for [Carbonio CE](https://www.zextras.com/carbonio-community-edition/). This Node.js application provides a REST API for storing, retrieving, and managing files, with Swagger documentation available at the root endpoint.

## Quick Start

### Prerequisites

- Docker or Podman installed
- Make

### Building Packages

```bash
# Build packages for Ubuntu 22.04
make build TARGET=ubuntu-jammy

# Build packages for Rocky Linux 9
make build TARGET=rocky-9

# Build packages for Ubuntu 24.04
make build TARGET=ubuntu-noble
```

### Supported Targets

- `ubuntu-jammy` - Ubuntu 22.04 LTS
- `ubuntu-noble` - Ubuntu 24.04 LTS
- `rocky-8` - Rocky Linux 8
- `rocky-9` - Rocky Linux 9

### Build Configuration

You can customize the build by setting environment variables:

```bash
# Use a specific container runtime
make build TARGET=ubuntu-jammy CONTAINER_RUNTIME=docker

# Use a different output directory
make build TARGET=rocky-9 OUTPUT_DIR=./my-packages
```

## Local Development

### Prerequisites

Node 22 is required to build the application. Alternatively, [nvm](https://github.com/nvm-sh/nvm) may be used:

```sh
nvm install
```

### Build and Run from Source

```bash
npm ci
npm run build
npm run start
```

The Storages CE server will be available at `http://localhost:5794/`.

### Testing

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Container Image

A container image is available on [Docker Hub](https://hub.docker.com/r/zextras/storages-ce).

To run the application:

```bash
docker run -it --rm -d -p 5794:10000 -e STORAGES_BIND_ADDRESS="0.0.0.0" --name storages-ce zextras/storages-ce
```

## Server Configuration

The following environment variables can be provided when starting the Storages CE server:

| Variable | Description | Default |
|---|---|---|
| `STORAGES_CONF_PATH` | Path to the configuration file | |
| `STORAGES_BIND_ADDRESS` | Address on which Storages CE will listen for API calls | `127.0.0.1` |
| `STORAGES_PATH` | Folder inside which all files are stored | |
| `STORAGES_PORT` | Port the server listens on for HTTP connections | |
| `STORAGES_BASE_URL` | Suffix path at which the server is served | |
| `STORAGES_LOGGING_DIRNAME` | Folder for log files produced by Storages CE | |
| `STORAGES_HTTPS_KEY_PATH` | Path to HTTPS private key | |
| `STORAGES_HTTPS_CERT_PATH` | Path to HTTPS certificate | |

The full URL is constructed as: `(http|https)://0.0.0.0:${STORAGES_PORT}/${STORAGES_BASE_URL}`

## API Documentation

Once the application is started, Swagger documentation is available at: `http://localhost:5794/`

## Installation

This package is distributed as part of the [Carbonio platform](https://zextras.com/carbonio). To install:

### Ubuntu (Jammy/Noble)

```bash
apt-get install carbonio-storages-ce
```

### Rocky Linux (8/9)

```bash
yum install carbonio-storages-ce
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.
