# Credit Report Parsing

The portal parses **MyFreeScoreNow 3-Bureau Credit Report** PDFs (classic and smart view). Clients can upload either version; the same pipeline extracts scores and negative items and passes the info through to the audit, score history, and Credit & Progress.

## Supported format

- **Source:** MyFreeScoreNow — *3-Bureau Credit Report & Scores* (classic view or smart view PDF).
- **Flow:** Upload → PDF text extraction (`unpdf`) → `analyzeCreditReport({ rawText })` → scores, negative items, and revolving totals parsed → audit created, negative items and score history saved.

## Current behavior

- **Scores:** From the upload form’s optional Experian/Equifax/TransUnion fields, or parsed from PDF text via `parseScoresFromReport()` and `parseScoreSnapshot()` in `src/lib/myfreescorenow-parser.ts` and `src/lib/credit-audit.ts`. Patterns: `Experian`/`EX`, `Equifax`/`EQ`, `TransUnion`/`TU` followed by a 3-digit score (300–850).
- **Negative items:** When `rawText` is present, `analyzeCreditReport()` uses `parseNegativeItemsFromReport()` (same parser module) to extract real accounts from the report. It looks for:
  - Section headers: Negative account history, accounts in collection, charge-offs, derogatory, past due, etc.
  - Lines containing negative-type keywords: collection, charge-off, late 30/60/90, delinquent, etc.
  - **Account name:** The creditor/account name is taken from the **previous line(s)** when they look like a real creditor (e.g. "JPMCB CARD", "CAPITAL ONE" above "Collection $500"). Lines that look like **score/product text** are never used: e.g. "Vantage Score 3.0", "credit score partnered", "Experian score", etc. The parser prefers lines that look like card/creditor names (JPMCB, Chase, bank, card) and skips up to 3 lines back to pick the best candidate.
  - Per item: bureau (from context or explicit Experian/Equifax/TransUnion), type (Collection, Charge-off, Late 30/60/90, etc.), balance (from $ or numeric amounts).
- **Revolving / utilization:** When the report text contains revolving (credit card) totals, the parser extracts **total balance** and **total limit** via `parseRevolvingFromReport()`. Utilization is then computed as (total balance / total limit) × 100 and shown in the audit PDF, along with the dollar amounts. If the report explicitly states "utilization" or "util" with a %, that is used first.
- **Counts:** `collectionsCount`, `chargeOffsCount`, and (when present in text) `utilizationPct`, `hardInquiriesCount`, `totalRevolvingBalance`, and `totalRevolvingLimit` are derived from the parsed data or from the report text.
- **No PDF text:** If the upload doesn’t produce usable `rawText` (e.g. image-only PDF), no sample placeholders are added; negative items will be empty and scores can still come from the manual score fields.

## Parser module

- **File:** `src/lib/myfreescorenow-parser.ts`
- **Exports:**
  - `parseScoresFromReport(text)` — returns `{ Experian?, Equifax?, TransUnion? }`.
  - `parseNegativeItemsFromReport(text)` — returns an array of `ParsedNegativeItem` (accountName, bureau, accountType, balance, negativeReason).
  - `parseRevolvingFromReport(text)` — returns `{ totalRevolvingBalance?, totalRevolvingLimit?, utilizationPct? }` for revolving accounts; used to compute and display utilization and dollar totals in the audit PDF.

The parser is written to work with both **classic** and **smart view** layouts so that either PDF version passes info correctly into the rest of the app.

## Where parsing is used

- **Upload:** `src/app/api/credit/upload/route.ts` extracts text from the PDF, then calls `analyzeCreditReport()` with `rawText`. The resulting negative items are saved as `NegativeItem` records and the audit is created with real counts and score snapshot.
- **Audit PDF:** Generated from the same analysis (scores, negative count, summary, recommended steps, capital readiness notes). Funding readiness score is no longer shown in the PDF.
- **Credit & Progress:** Displays the stored negative items with status, round, and letters-sent; once the report is uploaded and parsed, that page shows real data from the report.

## Matching the uploaded report’s look (audit PDF)

The **Credit Report Analysis** PDF is generated with `@react-pdf/renderer` and uses a fixed layout (cover, education, data table, derogatory table, next steps, etc.). It does not embed or copy graphics from the uploaded report.

To get the **same look** as your source report (e.g. MyFreeScoreNow’s layout, charts, or section styling):

1. **Screenshots or sample PDF** — Provide screenshots of the sections you want to mimic (scores, negative accounts, tables) or a redacted sample PDF. With that, we can adjust the audit PDF template (fonts, table layout, boxes, section order) to match.
2. **Exact graphics** — Logos, score gauges, or custom charts from the source would need to be recreated in the PDF (e.g. as images or simple shapes in the template) or the source would need to be used as a visual reference only; we cannot “paste” the original PDF’s rendering into the generated file.
3. **What we can do** — We can align column widths, add bureau cards, match heading styles, and reorder content so the flow matches your reference. Share the reference (screenshots or redacted PDF) and which sections matter most.

## Reading MyFreeScoreNow correctly / external help

The built-in parser is tuned for **MyFreeScoreNow 3-Bureau** text layout (classic and smart view). To improve accuracy further:

1. **Sample reports** — Providing 1–2 redacted MyFreeScoreNow PDFs (or paste of extracted text) helps add patterns for your exact format: section headings, how account names and “Vantage Score” / partner lines appear, and where revolving totals are stated.
2. **External parsing services** — If you need pixel-perfect or multi-format support, you can integrate an external credit-report parsing API (e.g. a service that accepts PDF or text and returns structured JSON). The upload route could then call that API when available and merge results with our parser (e.g. use external account names and our scores/utilization as fallback). No such integration is in the codebase today; the pipeline is designed so a future “parse via API” step can be added in `src/app/api/credit/upload/route.ts` before `analyzeCreditReport()`.
3. **OCR / image PDFs** — If the report is image-only (no extractable text), you’d need an OCR step or an external service that returns text before our parser can run. Current flow uses `unpdf` for text extraction; image-only PDFs will yield little or no `rawText`.
