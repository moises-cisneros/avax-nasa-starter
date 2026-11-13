#!/usr/bin/env bash
# Quick start: install, compile and run the frontend.
set -e
command -v pnpm >/dev/null 2>&1 || npm install -g pnpm
pnpm install
pnpm compile
[ -f packages/contracts/.env ] || cp packages/contracts/.env.example packages/contracts/.env
echo "Ready. Run: pnpm dev"
