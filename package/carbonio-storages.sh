#!/bin/bash

# SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
#
# SPDX-License-Identifier: AGPL-3.0-only

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root"
  exit 1
fi

if [[ "$1" != "setup" ]]; then
  echo "Syntax: carbonio-storages <setup> to automatically setup the service"
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

POLICY_NAME='carbonio-storages-policy'
POLICY_DESCRIPTION='Carbonio Storages service policy for service and sidecar proxy'
POLICY_RULES="$(
  cat <<EOF
"key_prefix" = {
  "carbonio-storages/" = {
    "policy" = "read"
  }
}
"node_prefix" = {
  "" = {
    "policy" = "read"
  }
}
"service" = {
  "carbonio-storages" = {
    "policy" = "write"
  }
  "carbonio-storages-sidecar-proxy" = {
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

# Declare the service as http
consul config write /etc/carbonio/storages/service-discover/service-protocol.json

# Allow other services to contact this service
consul config write /etc/carbonio/storages/service-discover/intentions.json

if [[ ! -f "/etc/zextras/carbonio-storages/token" ]]; then
  # create the token
  touch /etc/zextras/carbonio-storages/token
  consul acl token create -format json -policy-name "${POLICY_NAME}" -description "Token for carbonio-storages/$(hostname)" |
    jq -r '.SecretID' > /etc/zextras/carbonio-storages/token

  # to pass the token to consul-template we need to inject it to a env. variable
  # since it doesn't accept a file as an argument
  mkdir -p /etc/systemd/system/carbonio-storages.service.d/
  cat >/etc/systemd/system/carbonio-storages.service.d/override.conf <<EOF
[Service]
Environment="CONSUL_HTTP_TOKEN=$(cat /etc/zextras/carbonio-storages/token)"
EOF
  chmod 0600 /etc/systemd/system/carbonio-storages.service.d/override.conf
  systemctl daemon-reload
fi
chown carbonio-storages:zextras /etc/zextras/carbonio-storages/token
chmod 0600 /etc/zextras/carbonio-storages/token

LOG_DIR=$(grep dirname /etc/carbonio/storages/config.json | cut -d ":" -f2 | sed '0,/"/{s/"//}' | sed 's/",$//')
if [ ! -d ${LOG_DIR} ]; then
  mkdir -p ${LOG_DIR}
fi
echo "Log directory : ${LOG_DIR}"
chown carbonio-storages:zextras ${LOG_DIR}

STORE_DIR=$(grep path /etc/carbonio/storages/config.json | cut -d ":" -f2 | sed '0,/"/{s/"//}' | sed 's/",$//')
if [ ! -d ${STORE_DIR} ]; then
  mkdir -p ${STORE_DIR}
fi
echo "Store directory : ${STORE_DIR}"
chown carbonio-storages:zextras ${STORE_DIR}

consul reload

# limit token visibility as much as possible
export -n CONSUL_HTTP_TOKEN

systemctl restart carbonio-storages.service
systemctl restart carbonio-storages-sidecar.service
