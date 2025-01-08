FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=../prisma/test-analyzer.prisma

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"] 