#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma db push --skip-generate 2>&1 || echo "Migration warning (may be ok)"

echo "Seeding database..."
./node_modules/.bin/tsx prisma/seed.ts 2>&1 || echo "Seed skipped (may already exist)"

echo "Starting application..."
exec node server.js
