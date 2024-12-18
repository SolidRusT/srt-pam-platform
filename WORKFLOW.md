# TL;DR

## Docker compose workflow

```bash
git clone https://github.com/solidrust/srt-pam-platform.git
cd srt-pam-platform
cp .env.example .env
```

```bash
docker-compose up -d
```

```bash
docker-compose restart api
# or
docker rmi srt-pam-platform-api
docker-compose up -d
```

```bash
docker-compose down -v
```

## Local dev workflow

```bash
# First time setup:
cp .env.example .env
npm install
docker-compose up -d postgres redis  # Start dependencies
npx prisma migrate dev              # Apply database migrations
npm run dev                         # Start API in development mode

# For ongoing development:
npm run dev  # Auto-reloads on code changes

# For testing GraphQL:
- Keep GraphQL Playground open at http://localhost:4000/graphql
- Save your test queries in src/graphql/examples for reuse
```

