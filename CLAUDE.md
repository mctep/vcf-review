# CLAUDE.md

> **Keep this file up to date.** Any change to the stack, commands, folder structure, conventions,
> routes or deploy must update this file in the same commit.

## Project

Frontend-only prototype of a VCF interpretation and clinical reporting app for somatic oncology NGS.

Flow: choose a VCF (local upload or NFS/S3 file browser) → the case is created immediately → background
processing (uploading → validating → annotation → filtering & ranking → AI interpretation) → expert review of
ranked variants → report draft with an assistant chat → sign-off.

- Annotation, filtering and ranking are done by an **external annotation provider** (mocked). Never name a
  concrete provider or vendor in UI, code, comments or docs — use neutral wording ("annotation", "ranking").
- There is no backend and no VCF parser. All data is **synthetic** (`src/mocks`). Never add real patient data.
- English only: UI, code, comments, docs, commit messages.

## Stack

- React 19, Vite 8, TypeScript (strict)
- Chakra UI v3 with a custom system (`src/theme`), light/dark via `next-themes`
- Zustand (state), react-router (`HashRouter`), lucide-react (icons)
- Vitest + Testing Library (jsdom), oxlint, Prettier
- Fonts: Montserrat (UI), JetBrains Mono (genomic notation) via `@fontsource`

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173/vcf-review/ |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |
| `npm test` | Vitest (run once); `npm run test:watch` for watch mode |
| `npm run format` | Prettier |
| `npm run theme:types` | Chakra typegen. **Run after any change in `src/theme`.** Also runs on `postinstall`. |

Set `VITE_FAST_MOCKS=1` to make mocked services respond instantly.

## Architecture

```
src/
  domain/        Pure logic and types, no React. Covered by tests.
    types.ts     Case, Variant, ProcessingState, CaseMetadata, AuditEvent…
    case/        createCase(), audit helpers, sample id from file name, interpretation state
    metadata/    Required fields / blockers for interpretation, ICD-O-3 → OncoTree mapping
    upload/      File rules: accepted extensions, size, NFS / s3:// path building
    report/      buildReport(), draft summary/recommendations, plain-text export
    labels.ts    Display labels and theme palette names for domain enums
  services/      Interfaces + mock implementations. The only "backend". Wired in services/index.ts.
    storage      listConnections(), browse() for NFS/S3
    processing   runPipeline() (upload→filtering) and runInterpretation(); `?fail=<step>` demo switch
    lims         fetchOrder(sampleId) → order or null (coded diagnosis, tumor content when recorded)
    interpretation  chat() for the report assistant
  mocks/         Synthetic data: variants, seed cases, connections/file tree, OncoTree subset, LIMS orders, canned replies
  store/         caseStore (cases, background jobs, review actions, audit), uiStore (drawers)
  theme/         Chakra system: tokens, semantic tokens, text/layer styles, recipes, slot recipes. See docs/THEME.md
  ui/            Small design-system components on top of the theme (GlassCard, StatusPill, Mono, CitationLink…)
  layout/        AppShell, Sidebar, Logo
  features/      Screens: worklist, new-case (+ remote file browser), case, details, variants, report, audit
  components/ui/ Chakra CLI snippets (provider, color-mode, toaster, tooltip). Do not edit, except
                 provider.tsx which passes the custom `system`.
  dev/           UiShowcasePage (#/ui)
```

Key rules:

- Background jobs live in `store/caseStore.ts`. A case is created before processing starts, and the LIMS order
  is fetched automatically (`fetchLims`). The tumor type is mapped from the ICD-O-3 code (`tumorTypeMapping.ts`);
  ambiguous codes pre-fill the closest (broader) type, noted in the audit log — no confirmation step. AI
  interpretation starts automatically once `canStartInterpretation(metadata)` is true (required fields present). The draft records the inputs it was produced for (`interpretationContext`); changing tumor type
  or tumor content afterwards does **not** re-run it — the draft becomes stale (`staleInputs`) and
  `<StaleInterpretationCallout>` lets the reviewer re-run it (confirmation dialog; reviewer edits are discarded,
  selection kept) or keep it. Sign-off is blocked while the draft is stale and requires an explicit confirmation
  of the interpretation context.
- Show case status with `displayStatus(c)` (`domain/case/interpretation.ts`), not `c.status`: a processing case
  whose interpretation waits for metadata is shown as `needsInput` (orange pill, dot on the Details nav item,
  a toast when it happens in the background).
- LIMS never overwrites values with `origin: 'user'`.
- What is visible when is decided by `domain/case/interpretation.ts`: annotated variants (gene, HGVS, VAF,
  consequence) and report selection are available as soon as filtering & ranking are done (`isAnnotated`);
  AI-derived content (classifications, descriptions, flags, analysis details) and the report stay locked until
  `interpretationState(case) === 'done'`. Show the reason with `<InterpretationPending>`.
- Every user-visible change to a case appends an `AuditEvent`.
- The report header (Patient / Specimen / Clinical / Test) is built by `reportHeader()` in
  `domain/report/buildReport.ts`; clinical notes stay out of the report. Sign-off needs a patient ID and at least
  one selected variant (`signOffBlockReason`).
- Report regions that can be quoted in the chat carry `data-section-title` (and `data-section` when the
  assistant may edit them); see `features/report/SelectionQuote.tsx`. A quote travels with the chat message
  (`ChatMessage.quote`) to `services.interpretation.chat()`.
- Features call services only through `services` from `src/services/index.ts`.

## Routes (HashRouter)

| Route | Screen |
|---|---|
| `#/` | Cases overview |
| `#/new` | New case: local file or remote file browser |
| `#/case/:id/details` | Processing banner + case metadata |
| `#/case/:id/variants` | Ranked variant list + variant detail card (available after ranking; AI sections after interpretation) |
| `#/case/:id/report` | Report draft, assistant chat (`?chat=1` focuses it; select report text → "Quote in chat"), sign-off (locked until interpretation is done) |
| `#/ui` | Design system showcase |

Demo switch: add `?fail=<step>` (`uploading`, `validating`, `annotation`, `filtering`, `interpretation`) to the
hash URL, e.g. `#/new?fail=annotation`, to make that step fail once; Retry then succeeds.

## Styling conventions

- Use semantic tokens (`fg.muted`, `bg.panel`, `brand.solid`, `tier1.fg`…), text styles and layer styles.
  No hex values or raw palette steps in JSX.
- Clinical meaning → palette via `colorPalette`: `tier1`–`tier4`, `oncogenic`, `vus`, `benign`, `unknown`,
  `agreementHigh|Medium|Low`. Mapping helpers live in `domain/labels.ts`.
- New style variants go into a recipe in `src/theme`, then run `npm run theme:types` and document it in
  `docs/THEME.md` (and add it to `#/ui`).
- Work surfaces use `layerStyle="panel"` / `"card"`; translucent `glass` is for stats, upload and empty states.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on every push to `main` (lint → test → build → deploy).
`vite.config.ts` sets `base: '/vcf-review/'`, which is why routing is hash-based and assets use relative or
`import.meta.env.BASE_URL` paths.
