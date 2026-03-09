#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

# Install Node.js inside the YAP build container.
# Detects the distro and uses the appropriate package manager.

set -euo pipefail

NODE_MAJOR=22

if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
elif command -v dnf >/dev/null 2>&1; then
    dnf module disable -y nodejs 2>/dev/null || true
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    dnf install -y nodejs
elif command -v yum >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    yum install -y nodejs
else
    echo "ERROR: Unsupported distro — neither apt-get nor yum found" >&2
    exit 1
fi

# Verify we got the right version
INSTALLED_MAJOR=$(node --version | sed 's/^v//' | cut -d. -f1)
if [ "$INSTALLED_MAJOR" -ne "$NODE_MAJOR" ]; then
    echo "ERROR: Expected Node.js ${NODE_MAJOR}.x but got $(node --version)" >&2
    exit 1
fi

echo "Node.js $(node --version) installed successfully"
