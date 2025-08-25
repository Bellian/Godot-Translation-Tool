# Docker usage

## Docker usage

This project is configured to read runtime environment variables from a `.env` file.

## Quick start

1. Copy the example env (if present) or create a `.env` in the repository root:

```bash
cp .env.example .env
# edit .env to set values (DATABASE_URL, BASIC_AUTH_USER, AI_API_KEY, ...)
```

2. Build and run with Docker Compose:

```bash
docker compose up --build
```

## How envs are wired

- `docker-compose.yml` references an `env_file: .env` and exposes the listed env keys to the running container. Edit `.env` to change values without modifying compose.
- The `Dockerfile` accepts a build-arg `DATABASE_URL`. When you run `docker compose build`, Compose will pass `.env` values for build args declared under `build.args` (if present). The runtime container reads the envs from `.env`.

## Database behaviour

- By default the service mounts `./prisma` into `/app/prisma` inside the container. This allows the container to use and update the host `prisma/dev.db` file.
- The Dockerfile runs `npx prisma generate` and attempts `npx prisma migrate deploy || npx prisma db push` during the build to generate the client and apply migrations. This will only succeed if the DB is reachable during build (for example by mounting `./prisma` into the build context or passing a usable `DATABASE_URL`).
- Recommended: use runtime DB (mounted `./prisma`) and force server pages to be dynamic (the app already contains `export const dynamic = 'force-dynamic'` in pages that query the DB), so data is loaded when the server runs rather than baked at build time.

## Seeding and migrations

- To run migrations locally before building the image (so the build sees the populated DB), run on the host:

```bash
npx prisma migrate deploy
# or to push schema without migrations
npx prisma db push
```

- To seed the database, add a small script (e.g. `prisma/seed.ts`) and run it before the build or mount a pre-seeded `prisma/dev.db` file.

## Common troubleshooting

- If pages show no data after deploying the image, it's usually because the data was not available at build-time and the pages were statically rendered. Make sure pages that call the DB are dynamic at runtime (the repository already has `force-dynamic` in main pages).
- If you see SQLite permission errors, ensure the host `prisma` directory and `dev.db` are writable by Docker. On Linux this is typically fine; on macOS/Windows consider using named volumes or adjust permissions.
