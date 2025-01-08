#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")/.."

# Generate Prisma client
npx prisma generate --schema=../prisma/test-analyzer.prisma

# Create initial migration
npx prisma migrate dev --name init --schema=../prisma/test-analyzer.prisma 