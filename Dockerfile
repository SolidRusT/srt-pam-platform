FROM node:18-slim

WORKDIR /app

# Install system dependencies including OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl netcat-traditional && \
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

# Generate Prisma Client (this doesn't require DATABASE_URL)
RUN npx prisma generate

# Generate GraphQL types
RUN npx graphql-codegen

# Expose port
EXPOSE 4000

# Start script that will run migrations and start the server
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]