#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Starting dev server..."
echo "    Local:   http://localhost:5173"
echo "    Tailscale: http://100.123.155.124:5173"
echo "    Press Ctrl+C to stop"
echo ""

npm run dev
