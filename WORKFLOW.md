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

## GraphQL testing

- http://localhost:4000/graphql

ServerInfo is a simple query that returns the server status, version, and timestamp.

```graphql
query ServerInfo {
  serverInfo {
    status
    version
    timestamp
  }
}
mutation Register {
  register(input: {
    email: "test@example.com"
    password: "test123"
    username: "testuser"
  }) {
    accessToken
    refreshToken
    player {
      id
      email
      username
    }
  }
}

mutation Login {
  login(input: {
    email: "test@example.com"
    password: "test123"
  }) {
    accessToken
    refreshToken
    player {
      id
      email
      username
    }
  }
}
query {
  verifyResetToken(token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NDkxZTY5ZC03MGU4LTQ4NmEtYmE4OS1lMTI0ZThiNWEzYTciLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQiLCJpYXQiOjE3MzQ1ODg1ODEsImV4cCI6MTczNDY3NDk4MX0.qYRmnscxU_ovzuE59Uv-JtRXtAPQt1JOA90TmDNnq5w") {
    valid
    email
  }
}
mutation {
  resetPassword(input: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NDkxZTY5ZC03MGU4LTQ4NmEtYmE4OS1lMTI0ZThiNWEzYTciLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQiLCJpYXQiOjE3MzQ1ODg1ODEsImV4cCI6MTczNDY3NDk4MX0.qYRmnscxU_ovzuE59Uv-JtRXtAPQt1JOA90TmDNnq5w",
    newPassword: "new-password123"
  }) {
    success
    message
  }
}
```

and the other shit that requires an access token (Bearer) as an HTTP header:

```graphql
query Me {
  me {
    id
    email
    username
    createdAt
    updatedAt
  }
}
mutation Logout {
  logout(refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ZmNzg1MC04YmM3LTRmOTEtODdlYS1hYWU4NmRmMzg5YjEiLCJqdGkiOiJkMWRmMDllYTNmMDk3YzQ2ZDExNmU2MzA2NDk3MjMzNSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzM0NTg1Nzg5LCJleHAiOjE3MzcxNzc3ODl9.s4nQn_1MPIoUuyCj3Hh8pBXqFwkSVjXv80TBJX6KdEY")
}
```

