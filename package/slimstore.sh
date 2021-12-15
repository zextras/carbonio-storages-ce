#!/bin/bash
if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root"
  exit 1
fi

if [[ "$1" != "setup" ]]; then
  echo "Syntax: slimstore <setup> to automatically setup the service"
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

POLICY_NAME='slimstore-policy'
POLICY_DESCRIPTION='Slimstore service policy for service and sidecar proxy'
POLICY_RULES="$(
  cat <<EOF
"key_prefix" = {
  "slimstore/" = {
    "policy" = "read"
  }
}
"node_prefix" = {
  "" = {
    "policy" = "read"
  }
}
"service" = {
  "slimstore" = {
    "policy" = "write"
  }
  "slimstore-sidecar-proxy" = {
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
  "name": "slimstore",
  "protocol": "http"
}
EOF

if [[ ! -f "/etc/zextras/slimstore/token" ]]; then
  # create the token
  consul acl token create -format json -policy-name "${POLICY_NAME}" -description "Token for slimstore/$(hostname)" |
    jq -r '.SecretID' >/etc/zextras/slimstore/token
  chown zextras:zextras /etc/zextras/slimstore/token
  chmod 0600 /etc/zextras/slimstore/token

  # to pass the token to consul-template we need to inject it to a env. variable
  # since it doesn't accept a file as an argument
  mkdir -p /etc/systemd/system/slimstore.service.d/
  cat >/etc/systemd/system/slimstore.service.d/override.conf <<EOF
[Service]
Environment="CONSUL_HTTP_TOKEN=$(cat /etc/zextras/slimstore/token)"
EOF
  chmod 0600 /etc/systemd/system/slimstore.service.d/override.conf
  systemctl daemon-reload
fi

consul reload

# limit token visibility as much as possible
export -n CONSUL_HTTP_TOKEN

systemctl restart slimstore.service
systemctl restart slimstore-sidecar.service
