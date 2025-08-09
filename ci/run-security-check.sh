#!/bin/bash
# Local security check runner
# Usage: ./ci/run-security-check.sh

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  echo "Set it to your Supabase connection string with service role credentials"
  exit 1
fi

echo "Running security gates against database..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ci/check_security.sql

echo "✅ All security gates passed!"