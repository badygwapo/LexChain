# LexChain

LexChain is a Next.js web application for document workflows, verification and administration, backed by a separate Python/FastAPI service. The PWA uses the same web routes and requires connectivity for document work.

The application runs from this repository's root. The previous Expo application is preserved on `codex/backup-expo-before-web-pwa-2026-09-09`; it is not an active workspace.

## Local setup

Use Node **24.12.0 or newer** and **pnpm 11.13.0**, matching `package.json`.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. Start the FastAPI backend separately and configure `.env.local` for that backend. Keep environment files and credentials out of Git.

| Variable | Purpose |
| --- | --- |
| `API_URL` | Backend base URL for server requests |
| `NEXT_PUBLIC_API_URL` | Public backend URL setting and server fallback; never put credentials here |
| `NEXT_PUBLIC_APP_URL` | Public URL of this application |
| `NEXT_PUBLIC_USE_MOCK_API` | Enables browser mock-mode behavior for local checks |
| `USE_MOCK_API` | Enables server mock-mode behavior for local checks |

For fixture-based local checks, set both mock flags to `true`. Keep both `false` when checking the real backend. Rebuild production output after changing public environment settings. Mock results do not prove backend integration.

## Commands

All commands run from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm test` | Vitest application and route tests |
| `pnpm test:scripts` | Contract refresh script tests |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint check |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm generate:api-types` | Generate types from the local contract |

`pnpm-workspace.yaml` holds pnpm settings and dependency overrides only; there are no child workspaces.

## API contract and types

The checked-in contract is `openapi-updated.json`. Local type generation does not contact a backend:

```bash
pnpm generate:api-types
```

To update the contract intentionally, provide its full endpoint URL, review the diff, then regenerate:

```bash
OPENAPI_URL='http://localhost:8000/openapi.json' pnpm refresh:api-contract
git diff -- openapi-updated.json
pnpm generate:api-types
git diff -- lib/types/generated/schema.ts
```

Refresh requires `OPENAPI_URL` and replaces the contract only after a successful response and validation. It does not generate types automatically. Do not edit the generated schema by hand.

## PWA and browser checks

The manifest installs LexChain with the existing routes. The service worker registers in production and caches only `/offline.html`. On a failed eligible navigation, the fallback asks the user to reconnect. Documents, API responses, uploads and credentials are not cached; there is no offline upload queue or background synchronization. Updates wait for old tabs to close instead of forcing a reload during editing.

Build and start the production server, then run the smoke check in another terminal:

```bash
pnpm build
pnpm start
```

```bash
pnpm exec playwright install chromium
E2E_BASE_URL='http://localhost:3000' node e2e/pwa.mjs
```

The separate `node e2e/full-flow.mjs` script mutates backend data and needs a test backend, test accounts and a PDF fixture. Supply `E2E_LAWYER_EMAIL`, `E2E_LAWYER_PASSWORD`, `E2E_PARTICIPANT_EMAIL`, `E2E_PARTICIPANT_PASSWORD` and `E2E_PDF_PATH` through the environment; `E2E_BASE_URL` selects the web server. It is not a production smoke test.

## Deployment and architecture

Set the hosting project's root directory to **`.`**, install with `pnpm install --frozen-lockfile`, build with `pnpm build`, and use `pnpm start` when the host requires a start command. Configure the environment on the host; local environment files are not deployment configuration. Serve production over HTTPS for service-worker installation.

The root CI workflow runs tests, script tests, lint, typecheck and build. Repository configuration alone does not confirm that the workflow ran or that the hosting dashboard uses the new root. Real backend workflows, deployed CI and physical Android/iOS installation remain unverified until separately recorded.

See [the architecture guide](docs/ARCHITECTURE.md) for module ownership, boundaries and rollback, and [AGENTS.md](AGENTS.md) for contribution rules.
