#!/bin/sh
set -e

echo "Applying database schema..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "Starting application..."
exec "$@"
