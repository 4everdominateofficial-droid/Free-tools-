#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "DocuFlex Comprehensive Test Suite Runner"
echo "=================================================="

# 1. Run Manifest Security & Permission Audit
./android/scripts/check-permissions.sh

# 2. Run Independent Automated Unit & Security Tests
node android/scripts/run-automated-tests.cjs

echo "All independent automated tests passed successfully."
