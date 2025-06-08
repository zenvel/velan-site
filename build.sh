#!/bin/bash

# Disable ESLint during build
export DISABLE_ESLINT_PLUGIN=true
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERROR=1

# Run the build command
echo "🚀 Running build with ESLint and TypeScript errors disabled..."
npm run deploy-build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  exit 0
else
  echo "❌ Build failed. Check logs for details."
  exit 1
fi 