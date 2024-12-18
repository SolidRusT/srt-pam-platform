FROM node:18-slim

WORKDIR /app

# Install system dependencies including OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy configuration files
COPY tsconfig.json .
COPY codegen.yml .

# Copy prisma schema
COPY prisma ./prisma/

# Copy source files
COPY src ./src/

# Generate Prisma Client and GraphQL types
RUN npx prisma generate
RUN npx graphql-codegen

# Expose port
EXPOSE 4000

# Run the application
CMD npx prisma migrate deploy && \
    npx ts-node-dev --respawn --transpile-only src/index.ts