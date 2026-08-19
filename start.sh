#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Starting dev server..."
echo "    Open http://localhost:5173 in your browser"
echo "    Press Ctrl+C to stop"
echo ""

npm run dev
