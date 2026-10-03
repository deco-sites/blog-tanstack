#!/usr/bin/env bash
# Serve the production build on the parity port for manual browsing.
# (parity:record / parity:compare start their own fresh server per entry.)
set -u
PORT="${PARITY_PORT:-4319}"
cd "$(dirname "$0")/.."
if [ "${PARITY_SKIP_BUILD:-}" != "1" ]; then
  bun run build || exit 1
fi
while true; do
  npx vite preview --port "$PORT" --strictPort
  echo "[parity:serve] preview exited ($?), restarting in 1s" >&2
  sleep 1
done
