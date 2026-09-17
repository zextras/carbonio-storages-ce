## [1.1.0](https://github.com/zextras/carbonio-storages-ce/compare/1.0.17...1.1.0) (2026-09-17)

### Features

* **ci:** [IN-951] add arm64 platform to docker image builds ([#252](https://github.com/zextras/carbonio-storages-ce/issues/252)) ([bf0e1fe](https://github.com/zextras/carbonio-storages-ce/commit/bf0e1fe3f64a3a6911c7fd4ad54b664b1843975e))
* **packaging:** use arch=('any') for architecture-independent package ([#248](https://github.com/zextras/carbonio-storages-ce/issues/248)) ([cb8b183](https://github.com/zextras/carbonio-storages-ce/commit/cb8b183174b2881f65afb8f5cb4a8eb65f53428d))

### Bug Fixes

* **ci:** cap vitest forks to 2 to prevent k8s CPU saturation ([d8b9b22](https://github.com/zextras/carbonio-storages-ce/commit/d8b9b22b3b30b660de4c4a51653a6bb6b31a33a3))
* **release:** run semanticRelease() inside nodejs-22 container ([2413654](https://github.com/zextras/carbonio-storages-ce/commit/2413654b2ead93dc06a7a724bc75101f56829c3f))
* **release:** tagFormat must match current unprefixed tag scheme ([8e8b03a](https://github.com/zextras/carbonio-storages-ce/commit/8e8b03aa8e4761770b126f4a25689a5edec47dfa))
* resolve Dockerfile build failure from pnpm audit vulnerabilities ([27a4900](https://github.com/zextras/carbonio-storages-ce/commit/27a490073e4c26186b1943d5a6cc142c39880108))

### Reverts

* Revert "fix(release): run semanticRelease() inside nodejs-22 container" ([43b3450](https://github.com/zextras/carbonio-storages-ce/commit/43b34500b742f904991569c626a6e601159ccea2)), closes [#2](https://github.com/zextras/carbonio-storages-ce/issues/2) [#3](https://github.com/zextras/carbonio-storages-ce/issues/3)
