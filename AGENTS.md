# LexChain — Agent Instructions

This repository contains the **LexChain frontend only**: a Next.js App Router application for document workflows, verification and administration, with an installable PWA. The Python/FastAPI backend is a separate service maintained outside this repository. Next.js server components, Server Actions and API route handlers support frontend rendering and integration; they do not make this repository the authoritative backend.

Start with [README.md](README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), then verify their paths against the current checkout. Source lives under `src/`. The Expo application is preserved only on the backup branch.

## Frontend and backend API responsibilities

- The browser sends requests through frontend API clients to same-origin Next.js route handlers. These handlers receive requests, validate inputs, obtain server-held credentials, forward requests to the external backend and return the existing response/error contract.
- Server-rendered feature views and Server Actions may call server-only backend helpers directly. Feature queries/actions own domain orchestration; shared transport owns HTTP mechanics.
- The external backend owns persistence, document processing, blockchain operations, authoritative business rules and authorization. Do not implement a second database, backend domain service or permission authority here.
- Preserve backend request methods, payload encoding, headers, response shapes, error statuses and cookie behavior. Generated OpenAPI types describe the backend contract; TypeScript alone does not validate received data at runtime.

## Engineering principles

Apply these principles to new code, bug fixes, reviews and refactors. A folder move or visual makeover alone does not satisfy them; trace and improve the actual responsibilities and behavior within the authorized task.

- **Separation of concerns:** distinguish rendering, domain behavior, API transport and state management. Components mostly describe UI; hooks, queries, actions and services mostly describe behavior. Local interaction state can stay with its component.
- **Single responsibility:** each component, hook, schema or helper has one coherent reason to change. Split modules where responsibilities diverge, not at an arbitrary line count.
- **DRY without over-abstraction:** reuse meaningful repeated behavior and existing UI. Keep harmless repeated JSX when sharing it would require a universal component with excessive props.
- **KISS:** choose the simplest correct implementation. Reuse code, standard libraries, native browser/React/Next features and installed dependencies before writing custom infrastructure.
- **YAGNI:** implement current requirements. Do not create empty folders, speculative state, mandatory barrels, one-use factories, repositories or services without a real responsibility.
- **Composition over inheritance:** compose focused components and explicit functions; avoid deeply coupled hierarchies and giant configurable components.
- **Single source of truth:** keep each value in its appropriate owner. Server data belongs in the established data/query flow; local UI state belongs near the interaction.
- **Derived state over synchronized state:** calculate values from existing props/state where possible. Avoid duplicate state and effects whose only purpose is keeping copies synchronized.
- **Explicit side effects:** make networking, storage, subscriptions, timers, analytics and DOM work identifiable. Use effects for external synchronization, include cleanup and avoid effects for ordinary derived values.
- **Type safety and boundary validation:** use strict TypeScript and existing domain/generated types; avoid excessive `any` and unchecked casts. Validate untrusted inputs and consumed external data as required by the boundary, using existing schemas and Zod where appropriate.
- **Graceful asynchronous UI:** account for loading, success, empty and error states. Make pending mutations and failures clear; prevent accidental duplicate destructive submissions and preserve user input on failures.
- **Accessibility by default:** use semantic HTML, labels, keyboard access, visible focus, focus management and appropriate ARIA. Include accessible names for icon-only actions.
- **Behavior-focused tests:** verify visible outcomes, interaction and API/security contracts. Do not test incidental internals; preserve existing assertions and discovery when moving tests.
- **Consistent naming and ownership:** use predictable domain names and module locations. Keep feature-specific code with its feature and promote code to shared only when it serves genuine cross-domain consumers.
- **Enforced quality:** retain ESLint, strict TypeScript, project formatting conventions, import-boundary checks, focused regression tests and CI verification. Reuse established API/error handling and React Query behavior.

## Skills and Ponytail

- Consider the full installed skill catalogue for every task and use **all applicable skills**, including skills explicitly named by the user. Match their actual instructions and purpose; using all available skills does not mean running unrelated workflows on every task.
- Read each selected `SKILL.md` before acting and follow its relevant references. Announce which skills are being used and why. If a skill is unavailable, report that and continue with the best supported alternative; do not claim to have used it.
- Relevant work may use architecture/planning, frontend design, Next.js documentation, API design, diagnosis, TDD, security review, code review, browser QA and verification skills. Apply them within the user's authorized scope and preserve concurrent work.
- Use **[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)** through the installed `ponytail:ponytail` skill for coding, architecture, refactoring, debugging, reviews and dependency choices. Default to **full** mode unless the user changes or disables it.
- Ponytail's order is: question speculative need → reuse existing code → standard library → native platform → installed dependency → smallest correct implementation. Understand the full affected flow and callers first; fix root causes at their shared owner.
- Keep the diff small, readable and reviewable. Prefer deletion and simple composition; introduce an abstraction or dependency only when current requirements justify it.
- Ponytail never removes requested functionality, input validation, security, accessibility, data-loss handling or necessary verification. Fully implement an explicitly requested scope. Mark deliberate limitations with a `ponytail:` comment only when there is a real ceiling and upgrade path.

## Working rules

- Plan nontrivial work and delegate independent, bounded tasks when useful. Preserve concurrent edits and ignored local files.
- Trace the full affected flow and its callers before editing. Reuse existing functions, types and UI before adding code or dependencies.
- Keep changes small and readable. No empty feature scaffolding, mandatory barrels, one-use abstractions or unrelated cleanup.
- Add or update a focused regression test for behavior changes. Moving a test must preserve its assertions and discovery; source-reading tests must follow the moved implementation.
- Use TypeScript with strict mode. Keep secrets and generated output out of handwritten source changes.
- Review diffs for correctness and sensitive data, then run the relevant project checks before finishing. Report failed or unperformed checks separately from passing results.
- Preserve route URLs, role mappings, cookies, upload encoding, request methods, error contracts, redirects and cache behavior unless changing them is explicitly part of the task.

## Code discovery

Prefer the codebase-memory-mcp knowledge graph for code discovery:

1. `search_graph` to locate functions, classes, routes and variables.
2. `trace_path` to inspect callers and dependencies.
3. `get_code_snippet` to read specific source.
4. `query_graph` for complex relationships.
5. `get_architecture` for a high-level summary.

Use `rg` for string literals, error messages, configuration and non-code files, or when graph tools are unavailable, stale or insufficient. Never treat a pre-migration graph path as proof that the file still exists.

## Current layout and ownership

| Location | Responsibility |
| --- | --- |
| `src/app/` | Next route entry points, layouts, metadata, API receivers/proxies and route integration tests |
| `src/proxy.ts` | Next request interception and coarse session/legacy-route redirects |
| `src/features/documents/` | Library, upload, review, lifecycle and document activity |
| `src/features/verification/` | Integrity results and document verification views |
| `src/features/access/` | Invitations, requests, participants and portal role access |
| `src/features/office/` | Books, categories, reports and office settings |
| `src/features/account/`, `src/features/auth/` | Profile, authentication views and feature-owned schemas |
| `src/features/admin/` | Admin views, schemas, server helpers and Server Actions |
| `src/features/portal/` | Dashboard and portal shell/navigation |
| `src/shared/components/` | Browser-safe reusable UI |
| `src/shared/api/client.ts` | Browser transport to same-origin Next routes |
| `src/shared/api/shared.ts` | Existing shared API helpers while consumed |
| `src/server/api/backend.ts` | Server-only backend URL, token and request helpers |
| `src/config/api.ts` | Pure API configuration functions receiving an environment map |
| `src/shared/types/` | Backend type exports and generated OpenAPI schema |
| `src/shared/utils/` | Cross-domain utilities |
| `src/pwa/` | Production service-worker registration |
| `src/lib/mocks/` | Remaining local mock fixtures and lightweight mode helper; keep fixtures out of client bundles |
| `public/` | Static assets, PWA icons, service worker and offline fallback |
| `scripts/`, `e2e/` | Contract maintenance and browser checks |

## Next.js and dependency boundaries

- Before Next.js implementation, read the relevant installed documentation under `node_modules/next/dist/docs/`; resolve the installed package location if needed. Use official Next.js documentation when local docs are absent.
- Use the App Router and server components by default. Preserve `"use client"`, `"use server"` and Next-specific route exports at their valid boundaries.
- Route UI composes feature views; feature modules must not import route implementations from `src/app/`.
- `src/shared/` must not import features, routes or server modules. Domain-to-domain imports must be explicit and limited to the functions/types needed.
- Organize feature components, hooks, queries, actions, schemas and types only where they have real responsibilities. Existing `pages/` and feature `server/` modules are valid; avoid moving files just to fill a template.
- Client API operations call same-origin Next route handlers. Server-rendered views and server actions may call server helpers directly.
- Never import `src/server/**` or `src/features/*/server/**` into client modules, directly or transitively. Keep mock fixtures out of client bundles; browser mock checks should import only the lightweight flag helper.
- Keep backend/generated types in `src/shared/types/` and UI-specific types/schemas with their feature. Do not hand-edit `src/shared/types/generated/schema.ts`.
- Preserve existing React Query keys, enabled conditions and invalidation. Extract hooks only where they separate substantive data behavior from rendering.
- Use `@/` to resolve modules under `src/`. There are no active `apps/`, `packages/` or `@lexchain/*` workspace imports.
- Never import `.agents/`, `.agent/` or local design/tooling artifacts into runtime code.

## Security and offline behavior

- Treat backend authorization as authoritative; client access checks are only UI behavior. Validate inputs at route boundaries before forwarding them.
- Keep credentials, tokens and private keys on the server. Never hardcode backend URLs; configure them through the environment.
- PWA CacheStorage contains only the static offline fallback. Do not cache API responses, authenticated navigation responses, PDFs, uploads, tokens or user data.
- Do not add offline mutation queues, background sync or forced worker activation/reloads during document work.
- Keep service-worker registration production-only and nonblocking. Remove only obsolete caches owned by this worker.

## Tooling and checks

Use Node **24.12.0 or newer** and **pnpm 11.13.0**, as declared in `package.json`. Use pnpm only. `pnpm-workspace.yaml` contains package-manager settings, not child workspaces; retain its `lightningcss: 1.30.1` override unless a separate change is approved.

Run commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm test:scripts
pnpm typecheck
pnpm lint
pnpm build
```

Vitest discovers `src/**/*.test.{ts,tsx}`. Script tests use Node's built-in test runner, including `scripts/architecture-boundaries.test.mjs`. Use `pnpm start` to serve a production build; the PWA browser check is `node e2e/pwa.mjs` against that server.

`pnpm generate:api-types` uses the checked-in `openapi-updated.json` without a network refresh. Before regeneration, verify that its output matches the consumed schema at `src/shared/types/generated/schema.ts`: the current package script still targets the old `src/lib/types/generated/schema.ts` location. Resolve that mismatch within contract-maintenance work rather than generating a second unconsumed schema. Refresh explicitly with `OPENAPI_URL='http://localhost:8000/openapi.json' pnpm refresh:api-contract`, review the contract diff, then regenerate types. See README for setup and test-backend requirements.

## Archive and handoff

The published archive `codex/backup-expo-before-web-pwa-2026-09-09` preserves Expo at `1d3852c74c5162d1cb30f5aa5782acafe7e17b57`. Do not modify the archive or restore it wholesale onto the active branch. Revert the relevant migration commit for rollback; inspect the archive in a separate worktree if needed.

Deployment uses repository root `.`. A passing local build does not verify hosting-dashboard settings, deployed CI, real backend flows or installation on physical Android/iOS devices. Record those checks explicitly when performed.
