#!/usr/bin/env bash
# Cleanup script for removing generated files and temporary assets

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning up project...${NC}"

# Delete PNG files from project root
echo "Removing PNG files from root..."
rm -f *.png 2>/dev/null || true

# Delete .playwright-mcp directory contents
echo "Removing Playwright MCP logs and snapshots..."
rm -rf .playwright-mcp/*.log 2>/dev/null || true
rm -rf .playwright-mcp/*.yml 2>/dev/null || true

# Remove empty .playwright-mcp directory if it exists
if [ -d ".playwright-mcp" ] && [ -z "$(ls -A .playwright-mcp)" ]; then
    rmdir .playwright-mcp
fi

echo -e "${GREEN}✓ Cleanup complete${NC}"
