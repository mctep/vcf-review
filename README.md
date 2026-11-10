# vcf-review

A clickable prototype of a VCF interpretation and clinical reporting app for somatic oncology NGS.
Built with React, TypeScript and Chakra UI v3. **All data is synthetic — not for clinical use.**

**Live demo:** https://mctep.github.io/vcf-review/

## What it shows

1. **New case.** Pick a VCF from a local file or from a pre-configured NFS mount / S3 bucket through a file browser.
   The case is created right away.
2. **Background processing.** Uploading → validating → annotation → filtering & ranking → AI interpretation.
   Keep working while it runs: fill in metadata, fetch the test order from the LIMS, browse other cases.
   Interpretation waits for the fields it depends on (tumor type, tumor content).
3. **Variant review.** Ranked variant list, classifications (oncogenicity, AMP/ASCO/CAP tier, biological
   function) with criteria and evidence, AI-drafted gene and variant descriptions with inline citations and
   traceability, source agreement, analysis details, feedback.
4. **Report.** Draft built from the selected variants, an assistant chat that edits sections, sign-off that
   locks the report, and an append-only audit log.

Light and dark themes. The design system is documented in [docs/THEME.md](docs/THEME.md) and shown live at `#/ui`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/vcf-review/.

Demo switch: append `?fail=annotation` to the URL hash (e.g. `#/new?fail=annotation`) to simulate a failing
step. Retry then succeeds.

## Scripts

`npm run build` · `npm run preview` · `npm run lint` · `npm test` · `npm run theme:types`

## Project notes

Architecture, conventions and routes are described in [CLAUDE.md](CLAUDE.md).

Variant coordinates, descriptions and evidence in this repository are illustrative and must not be used for
clinical decisions.
