#!/usr/bin/env bash
# Serve the site locally. No build step is required — the page is static.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-8080}"
echo "EduSphere → http://localhost:${PORT}"
python3 -m http.server "$PORT"
