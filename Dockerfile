FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 4000

# Start development server with hot reloading
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]