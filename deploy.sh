#!/bin/sh
# Publish the site to https://relocatewzamir.web.app
# Only the two pages are copied into dist/, so nothing else in this folder can ever go public.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html admin.html dist/
npx -y firebase-tools@latest deploy --only hosting --project relocatewzamir --non-interactive
