#!/usr/bin/env bash
set -euo pipefail
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_proxy npm_config_http_proxy npm_config_https_proxy
# fallback registry override
npm install --registry=https://registry.npmjs.org "$@"
