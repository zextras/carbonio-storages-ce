# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

ARG NODE_IMAGE_VERSION=22

# All build stages run natively on the CI builder (BUILDPLATFORM, amd64) — no
# QEMU. @yao-pkg/pkg cross-bundles the Node base binary for the requested
# target arch, so we must pass an explicit per-TARGETARCH target instead of the
# host-arch default ('node22-linux'), otherwise the arm64 image would silently
# ship an amd64 executable.
FROM --platform=$BUILDPLATFORM docker.io/library/node:${NODE_IMAGE_VERSION} AS dependencies

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

# install production dependencies here, for better reuse of layers
RUN pnpm install --prod --frozen-lockfile

FROM --platform=$BUILDPLATFORM docker.io/library/node:${NODE_IMAGE_VERSION} AS builder

# TARGETARCH is provided by buildx (amd64|arm64); map it to the pkg Node target.
ARG TARGETARCH

WORKDIR /usr/src/app

COPY . .

COPY --from=dependencies \
  /usr/src/app/node_modules /usr/src/app/node_modules

RUN corepack enable && corepack prepare pnpm@latest --activate

# Build TS, then cross-bundle the standalone binary for the TARGET arch.
# pkg target arch: amd64 -> x64, arm64 -> arm64.
RUN set -eux; \
    case "${TARGETARCH}" in \
        amd64) PKGARCH=x64 ;; \
        arm64) PKGARCH=arm64 ;; \
        *) echo "unsupported TARGETARCH=${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    pnpm install --frozen-lockfile && pnpm store prune && pnpm run build; \
    pnpm exec pkg -t node22-linux-${PKGARCH} -C Brotli -o carbonio-storages .

# Prep stage (BUILDPLATFORM) creates the arch-independent log dir so the final
# stage needs zero RUN.
FROM --platform=$BUILDPLATFORM docker.io/library/busybox AS prep
RUN mkdir -p /staging/var/log/carbonio/storages/

FROM docker.io/library/debian:bookworm-slim

WORKDIR /home/node/app
COPY --from=prep /staging/var /var
COPY --from=builder /usr/src/app/carbonio-storages carbonio-storages

ENV STORAGES_PORT=10000
ENV STORAGES_BIND_ADDRESS=0.0.0.0
EXPOSE 10000

ENTRYPOINT ["/home/node/app/carbonio-storages"]
