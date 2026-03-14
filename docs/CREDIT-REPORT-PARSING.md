# Credit Report Parsing

The portal parses **MyFreeScoreNow 3-Bureau Credit Report** PDFs (classic and smart view). Clients can upload either version; the same pipeline extracts scores and negative items and passes the info through to the audit, score history, and Credit & Progress.

## Supported format

- **Source:** MyFreeScoreNow — *3-Bureau Credit Report & Scores* (classic view or smart view PDF).
- **Flow:** Upload → PDF text extraction (`pdf-parse`) → `analyzeCreditReport({ rawText })` → scores and negative items parsed → audit created, negative items and score history saved.

## Current behavior

- **Scores:** From the upload form’s optional Experian/Equifax/TransUnion fields, or parsed from PDF text via `parseScoresFromReport()` and `parseScoreSnapshot()` in `src/lib/myfreescorenow-parser.ts` and `src/lib/credit-audit.ts`. Patterns: `Experian`/`EX`, `Equifax`/`EQ`, `TransUnion`/`TU` followed by a 3-digit score (300–850).
- **Negative items:** When `rawText` is present, `analyzeCreditReport()` uses `parseNegativeItemsFromReport()` (same parser module) to extract real accounts from the report. It looks for:
  - Section headers: Negative account history, accounts in collection, charge-offs, derogatory, past due, etc.
  - Lines containing negative-type keywords: collection, charge-off, late 30/60/90, delinquent, etc.
  - Per item: creditor/account name, bureau (from context or explicit Experian/Equifax/TransUnion), type (Collection, Charge-off, Late 30/60/90, etc.), balance (from $ or numeric amounts).
- **Counts:** `collectionsCount`, `chargeOffsCount`, and (when present in text) `utilizationPct` and `hardInquiriesCount` are derived from the parsed data or from the report text.
- **No PDF text:** If the upload doesn’t produce usable `rawText` (e.g. image-only PDF), no sample placeholders are added; negative items will be empty and scores can still come from the manual score fields.

## Parser module

- **File:** `src/lib/myfreescorenow-parser.ts`
- **Exports:**
  - `parseScoresFromReport(text)` — returns `{ Experian?, Equifax?, TransUnion? }`.
  - `parseNegativeItemsFromReport(text)` — returns an array of `ParsedNegativeItem` (accountName, bureau, accountType, balance, negativeReason).

The parser is written to work with both **classic** and **smart view** layouts so that either PDF version passes info correctly into the rest of the app.

## Where parsing is used

- **Upload:** `src/app/api/credit/upload/route.ts` extracts text from the PDF, then calls `analyzeCreditReport()` with `rawText`. The resulting negative items are saved as `NegativeItem` records and the audit is created with real counts and score snapshot.
- **Audit PDF:** Generated from the same analysis (scores, negative count, summary, recommended steps, capital readiness notes). Funding readiness score is no longer shown in the PDF.
- **Credit & Progress:** Displays the stored negative items with status, round, and letters-sent; once the report is uploaded and parsed, that page shows real data from the report.
