#!/bin/bash

# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root"
  exit 1
fi

if [[ "$1" != "setup" ]]; then
  echo "Syntax: storages-ce <setup> to automatically setup the service"
  exit 1
fi

# decrypt the bootstrap token, asking the password to the sys admin
# --setup check for SETUP_CONSUL_TOKEN env. variable and uses it
# to avoid re-asking for the password
echo -n "insert the cluster credential password: "
export CONSUL_HTTP_TOKEN=
CONSUL_HTTP_TOKEN=$(service-discover bootstrap-token --setup)
EXIT_CODE="$?"
echo ""
if [[ "${EXIT_CODE}" != "0" ]]; then
  echo "cannot access to bootstrap token"
  exit 1
fi
# limit secret visibility as much as possible
export -n SETUP_CONSUL_TOKEN

POLICY_NAME='storages-ce-policy'
POLICY_DESCRIPTION='Storages-CE service policy for service and sidecar proxy'
POLICY_RULES="$(
  cat <<EOF
"key_prefix" = {
  "storages-ce/" = {
    "policy" = "read"
  }
}
"node_prefix" = {
  "" = {
    "policy" = "read"
  }
}
"service" = {
  "storages-ce" = {
    "policy" = "write"
  }
  "storages-ce-sidecar-proxy" = {
    "policy" = "write"
  }
}
EOF
)"

# create or update policy for the specific service (this will be shared across cluster)
consul acl policy create -name "${POLICY_NAME}" -description "${POLICY_DESCRIPTION}" -rules "${POLICY_RULES}" >/dev/null 2>&1
if [[ "$?" != "0" ]]; then
  consul acl policy update -no-merge -name "${POLICY_NAME}" -description "${POLICY_DESCRIPTION}" -rules "${POLICY_RULES}"
  if [[ "$?" != "0" ]]; then
    echo "Setup failed: Cannot update policy for ${POLICY_NAME}"
    exit 1
  fi
fi

# declare the service as http
cat <<EOF | consul config write -
{
  "kind": "service-defaults",
  "name": "storages-ce",
  "protocol": "http"
}
EOF

if [[ ! -f "/etc/zextras/storages-ce/token" ]]; then
  # create the token
  consul acl token create -format json -policy-name "${POLICY_NAME}" -description "Token for storages-ce/$(hostname)" |
    jq -r '.SecretID' >/etc/zextras/storages-ce/token
  chown carbonio-storages:carbonio-storages /etc/zextras/storages-ce/token
  chmod 0600 /etc/zextras/storages-ce/token

  # to pass the token to consul-template we need to inject it to a env. variable
  # since it doesn't accept a file as an argument
  mkdir -p /etc/systemd/system/storages-ce.service.d/
  cat >/etc/systemd/system/storages-ce.service.d/override.conf <<EOF
[Service]
Environment="CONSUL_HTTP_TOKEN=$(cat /etc/zextras/storages-ce/token)"
EOF
  chmod 0600 /etc/systemd/system/storages-ce.service.d/override.conf
  systemctl daemon-reload
fi

consul reload

# limit token visibility as much as possible
export -n CONSUL_HTTP_TOKEN

systemctl restart storages-ce.service
systemctl restart storages-ce-sidecar.service
