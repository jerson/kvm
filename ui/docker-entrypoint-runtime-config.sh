#!/bin/sh
set -eu

CLOUD_API_VALUE="${CLOUD_API:-}"
CLOUD_AUTH_PROVIDERS_VALUE="${CLOUD_AUTH_PROVIDERS:-}"

sed \
  -e "s|__CLOUD_API__|${CLOUD_API_VALUE}|g" \
  -e "s|__CLOUD_AUTH_PROVIDERS__|${CLOUD_AUTH_PROVIDERS_VALUE}|g" \
  /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
