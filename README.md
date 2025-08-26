# Godot Translation Tool

This small web tool helps developers translate Godot games by providing a simple UI and API to manage translatable strings, produce Godot-readable CSV exports, and assist with AI translations. It's designed to be local-first and Docker-ready, using a lightweight SQLite database for local development. Key behavior includes automatic export key generation with visual highlighting (keys are highlighted until clicked, clicking copies the key, and keys are regenerated when labels change), Godot CSV export formatting, and an optional AI translation feature that preserves placeholders like `{placeholder}` and BBCode tags (for example `[b]text[/b]` -> `[b]translated[/b]`).

## Collaboration & multi-user usage

This tool is designed to support collaborative translation workflows. Multiple contributors can edit projects, groups and entries when the application is hosted in a shared environment (for example, a server or a Docker deployment using the same database file). Practical notes:

- Run the app in a shared environment (Docker, VPS, or any server) so colleagues access the same database/backend rather than separate local copies.
- For larger/remote teams consider switching the Prisma datasource from SQLite to a networked database (Postgres/MySQL) so concurrent edits scale and avoid file-lock issues.
- Basic Auth is provided as a lightweight access control; for public-facing deployments add stronger auth to protect collaborators' data.

These simple deployment patterns let multiple users manage translations together while keeping the app local-first and easy to self-host.

## Quick start — local

1. Copy example env and set your values:

```bash
cp example.env .env
# then edit .env to set database / AI variables as needed
```

2. Install and run (Node/npm):

```bash
npm install
npm run build
npm run start
```

After installation the project will create the SQLite DB at `prisma/dev.db`.

## Quick start — Docker

You can host the app within minutes using Docker and the included docker-compose configuration:

1. Copy example env and set your values:

```bash
cp example.env .env
# then edit .env to set database / AI variables as needed
```

```bash
npm run docker
```

This will build and run the service in a containerized environment.

## Environment / AI setup

To enable AI translation features, set the following variables in your `.env` file:

- `AI_HOST` — the AI service host URL
- `AI_API_KEY` — API key for the AI service
- `AI_MODEL_ID` — model identifier to use

When AI is configured, the app will attempt to translate text while preserving placeholders (`{placeholder}`) and BBCode tags (`[b]...[/b]`, `[i]...[/i]`, etc.).

## Authentication

For now the app offers a simple Basic Auth protection which can be configured via environment variables. This is intended as a lightweight safety measure for self-hosting and development.

- `BASIC_AUTH_USER` — username for basic auth.
- `BASIC_AUTH_PASS` — password for basic auth.

Add these to your `.env` (or the environment used by Docker) to enable the protection. Note: basic auth is a minimal protection and not a full production-grade auth solution — replace or augment it if you publish the service publicly.

## Exports

- Exported files are CSV files formatted for Godot to import as translation files.
- The app generates export keys automatically to map labels to exportable keys.

## Notes on export-key highlighting

- Keys are highlighted red until you click them and copy them to your clipboard.
- If you edit a label, its key will be regenerated and the highlight will be reset to draw attention to the change.

## Screenshots

![Projects view screenshot](docs/images/projects.png)

_Projects view: list of projects and quick actions._

![Groups view screenshot](docs/images/groups.png)

_Groups view: groups and entries with export keys highlighted._

## Contributing

Small improvements, bug fixes, and documentation updates are welcome. Follow the repo conventions (TypeScript, Next.js App Router, Tailwind, Prisma) and run type checks / linting before opening a PR.

## License

This project does not include a license file; add one if you intend to publish or share the code publicly.
