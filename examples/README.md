## Univer Sheets-only Example

### Overview
This `examples` app is a minimal, sheets-only demo of Univer. It serves a single route at `/sheets`, trims other demos (homepage, docs, slides, mobile, uni, etc.), and keeps the build/dev experience fast and focused.

Key points:
- **Single entry**: `/sheets/`
- **Worker-based formulas** via RPC
- **Lean plugin set** for essential Sheets functionality
- Optional **CSV/XLSX import/export** helpers

### Prerequisites
- **Node**: >= 20
- **pnpm**: >= 10

### Quick start
From the repo root:

```bash
pnpm install
pnpm dev
# → opens http://localhost:3000/sheets/
```

Alternatively, run inside `examples/`:

```bash
pnpm --filter univer-examples dev:demo
# → opens http://localhost:3000/sheets/
```

### Scripts
The root `package.json` includes helpful shortcuts:
- `dev`: `pnpm --filter univer-examples dev:demo -- --host 0.0.0.0`
- `build:demo`: `pnpm --filter univer-examples build:demo`

Inside `examples/package.json`:
- `dev:demo`: start dev server (esbuild, watch)
- `build:demo`: build demo assets
- `dev:e2e` / `build:e2e`: demo variant for e2e
- `prepare`: regenerate HTML (for available entries)

### What’s included vs. removed
- Kept: the minimal set of packages/plugins needed to render Sheets and run formulas remotely.
- Removed: other demos and their dependencies (docs, slides, mobile, uni, adapters not used, uniscript/monaco, debugger, etc.).

### Architecture
- Dev/Build: `examples/esbuild.config.ts` serves `./local` at port 3000 and bundles entries
- Entries kept:
  - `examples/src/sheets/main.ts` (main thread UI + plugin registration)
  - `examples/src/sheets/worker.ts` (formula execution in a worker via RPC)
  - `examples/src/sheets/lazy.ts`, `examples/src/sheets/very-lazy.ts` (optional UI/utility plugin loaders)
- HTML: `examples/public/sheets/index.html` (loads `./main.js`)

Typical file layout:
```text
examples/
  public/
    sheets/
      index.html
  src/
    sheets/
      main.ts
      worker.ts
      lazy.ts
      very-lazy.ts
      custom/
        import-csv-button.ts
        import-xlsx-plugin.ts
        export-xlsx-plugin.ts
        save-autosave-plugin.tsx
  esbuild.config.ts
  package.json
```

### Worker-based formula execution
Formulas run off the main thread. The main app registers `UniverFormulaEnginePlugin` and `UniverSheetsFormulaPlugin` in non-executing mode and delegates execution to the worker. The worker registers the formula engine plus the remote sheets formula plugin and handles execution requests over RPC.

At a glance:
- Main: registers UI, sheets, and RPC main-thread plugin; creates the worker
- Worker: registers engine + remote formula plugins; processes execution

### CSV/XLSX import/export (optional)
If you enable the provided helpers in `examples/src/sheets/custom/`:
- `import-csv-button.ts` and `import-xlsx-plugin.ts`: import data
- `export-xlsx-plugin.ts`: export workbook
- `save-autosave-plugin.tsx`: simple autosave demo

These rely on `papaparse` and `xlsx`. Keep only if you need import/export in the demo.

### Development tips
- URL: `http://localhost:3000/sheets/`
- If you see 404s: ensure only `sheets` is configured as an entry and `public/sheets/index.html` exists
- If port 3000 is in use: stop the conflicting process or change the serve port in `esbuild.config.ts`
- If builds fail after trimming: `pnpm install` at root to refresh workspace links

### Trim plan (from PRD)
Phases implemented for sheets-only:
1) Serve sheets-only entries (`main.ts`, `worker.ts`)
2) Remove other demo sources and public files
3) Trim plugins to a minimal, sheets-focused set
4) Prune `examples/package.json` dependencies to match the trimmed code
5) Optionally prune unused workspace packages (skipped/cautious)
6) Clean build extras (drop unneeded monaco/vue workers if not used)

### Task tracking (Taskmaster)
Work was tracked in `.taskmaster/`.
- Done: Configure sheets-only build; remove other demos; trim plugins; prune deps; implement worker formulas; CSV/XLSX (optional) helpers; cleanup; docs; CI guard for /sheets.
- Cancelled: aggressive workspace pruning (kept conservative to avoid breakage).

### Troubleshooting
- "Nothing renders": verify `examples/public/sheets/index.html` and `examples/src/sheets/main.ts` exist and build without errors
- "Worker not found": check the worker path/URL passed to RPC main thread plugin and that `worker.ts` builds
- "Import/export errors": ensure `papaparse`/`xlsx` are installed and the custom plugin files are wired in

### License
Apache-2.0 (see repo `LICENSE`).

## Sheets-only Examples

Run the local dev server (serves only `/sheets`):

```bash
pnpm --filter univer-examples dev:demo
# open http://localhost:3000/sheets
```

Build the static bundles:

```bash
pnpm --filter univer-examples build:demo
# output in examples/local/sheets
```

What changed:
- Build only includes `src/sheets/main.ts` and `src/sheets/worker.ts`.
- Non-sheets demos were removed from `examples/src` and `examples/public`.
- Plugins trimmed to sheets-only; docs UI reintroduced for editor services used by formula UI.
- Output layout mirrors `src` (`/sheets/main.js`), fixing 404s.

Import/Export:
- CSV/XLSX import/export enabled via custom plugins registered in `src/sheets/main.ts`.


