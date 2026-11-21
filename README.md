# MWTSI Address Intelligence · Global Hybrid Address Remediation

A working local Next.js/React TypeScript application for Excel address remediation, explainable enrichment, deterministic slash Hybrid transformation, exception review and audited Excel export.

## Run

Requires Node22/24 LTS and npm.

```bash
npm install
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. Upload Name, Address1, Address2, Address3 (optional Bank_Country and Group), use the template, or select demonstration data. All three address columns are free-form. Reference database initializes on first processing. Data remains local by default.

## Verify

```bash
npm test
npm run typecheck
npm run build
REGRESSION_WORKBOOK=/path/to/supplied.xlsx npm test
npm run regression -- /path/to/supplied.xlsx work/regression
npm run samples
```

For browser tests: `npx playwright install chromium` then `npm run test:e2e`. See docs/TEST_STRATEGY.md for the managed-session browser verification limit.

## Workflow

1. Upload XLSX, maximum20MB/50,000 rows. Headers required, cells should contain text/values.
2. Inspect automatic/review/name-only/error counts, validation and heuristic confidence. Filter results and inspect any row.
3. Review exceptions only; inspect originals, evidence, alternatives, proposed components, live Hybrid preview and all audits. Enter reviewer/reason; accept output as-is, save optional edits, or reject. You can also accept all pending outputs in a batch. Detected issues do not require correction; acceptance keeps validation results, confidence and the audit trail intact. No reupload needed.
4. Export Results, Summary and lossless Audit worksheets. Unresolved/rejected proposals are included and labeled; export is not a payment-release instruction.

## Structure

- src/lib/hybrid: pure fixed rules, priorities, truncation and separate validation.
- src/lib/parser + enrichment: global reference-assisted intelligence and evidence.
- src/lib/reference: replaceable repository abstraction, indexed SQLite adapter.
- src/db: schema, seed and persistent batch/review repositories.
- src/lib/excel: validated import, OOXML compatibility and export.
- src/app: Next.js pages and local APIs; src/components: operational workflow.
- scripts: seed, streaming GeoNames import, workbook regression, samples, benchmark.
- tests and e2e: automated verification.

## Scope and limitations

Implements the requested internal four-line slash profile; PMPG checks do not certify a full ISO20022 payment message. Source differences are explicit in docs/OPEN_QUESTIONS.md. Confidence is heuristic. Seed reference data covers76 demonstration localities and required markets; full worldwide completeness requires licensed/quality-controlled reference imports. Unknowns route to review. The local reviewer field is not authenticated enterprise identity. See docs/DEPLOYMENT.md before operational exposure.

Uploaded source files are not part of the application archive or source control. No paid API, external provider, public deployment or message sending is enabled.

## Documentation

Architecture, requirements summary, implementation plan, open questions, Hybrid rules, enrichment, reference data, tests and deployment are under docs/. Samples can be recreated with `npm run samples`. Verification results from this delivery are in docs/VERIFICATION.md.

## Additional columns and Group (v1.2)

Only Name, Address1, Address2, Address3 and Bank_Country are analyzed. Group is a standard optional per-record source column, kept unchanged and used for exact filtering and natural A–Z/Z–A sorting. Other columns such as reference IDs, cost centers, amounts and notes pass through to Excel Results and the source audit; they cannot influence parsing, confidence, country, validation or processing status.

Use Filter by Group and Sort by Group on summary, review and export pages; clicking the Group column header also toggles sort. Missing Group values appear as (No group); older workbooks and saved batches remain supported. Excel export uses the selected Group and sort, including on the export page. Dashboard metrics and Accept all pending refer to the whole batch; other table search/status filters apply on screen only.

Extra columns retain their original headers and text/number/boolean/date values and number formats. A computed field that collides with a source header gains a Remediation. prefix, recorded in Summary; input data is never overwritten by computed data. Main and Group header names are recognized case-insensitively with surrounding spaces ignored; extra header text is retained. Duplicate headers or data under an unnamed column require a header correction so values cannot be silently lost.

Additional-column formulas are never executed: export their cached values when present, otherwise the formula as inert text, and retain original formula text in the source audit. Hyperlinks carry their display text; the original URL is retained in source audit metadata. Formula cells remain unsupported in analyzed address fields and Group. No schema migration is required; keep the existing data folder when updating. Newly uploaded files are required to capture extra columns that older app versions did not retain.

## Export options (v1.3)

Choose Export format on the results, review or export page:

- **Full analysis** (default): Results with source fields, extra columns, parsed/enriched components, evidence, validation, decisions and Hybrid lines, plus Summary and Audit worksheets.
- **Source + Hybrid output**: one Results worksheet containing only the standard source fields, Group, every additional source column and Hybrid_Line1 through Hybrid_Line4. No generated analysis/status/confidence columns, Summary or Audit worksheets are included. It uses the stored transformed output; it does not rerun processing or require fixes/acceptance.

Both formats follow the selected Group filter and sort order and retain source values and types. Source headers that already use a Hybrid_Line name stay unchanged; the transformed field gains a Remediation. prefix and a header note explaining the collision. Full analysis remains the place for validation and acceptance details. Extra formulas remain inert/cached values in either mode; their full original metadata is retained in the database and Full analysis audit.

The export API accepts mode=full or mode=source-hybrid (omitting mode preserves Full analysis). The concise filename is hybrid-address-source-hybrid.xlsx. Compact export retains source text up to Excel's 32,767-character cell limit; values exceeding that limit require Full analysis, which retains complete source data in chunked Audit rows.

## Name interpretation (v1.4)

Name is now evaluated with Address1 before address parsing. Exact multi-token Name duplicates/known fragments can be removed from Address1 with an audit. Explicit AND/& joint continuations and labeled Name/Name Continued/NAME2 text can be proposed as Name information; new cross-field values require review. Numbered street tails and delimiter-separated address content are retained. Unmarked, locality-overlapping or building/street-ambiguous text remains in place with review findings where warranted. This is evidence-based classification, not a universal personal-name recognizer. Extra columns such as Name2 remain pass-through metadata; NAME2: inside Address1 is an explicit source label.

The deterministic engine still keeps the first66 evaluated Name code points, splits at33 into 1a/1b, audits the remainder, and reserves both Name lines ahead of optional address lines and the single mandatory country/town line. The second 1/ contains Name continuation only. Review now exposes evaluated Name, both segments, confidence/evidence, source interpretation audit and truncation tail; Beneficiary name is editable and reruns the same rules. Full analysis adds Name-specific fields; concise output remains source plus four Hybrid lines. Acceptance without corrections is unchanged.

Existing stored batches are not automatically recalculated, so existing decisions stay intact. Reupload original workbooks to apply new Name interpretation; legacy records show a notice. For the full Name-case regression:

```bash
NAME_REGRESSION_WORKBOOK=/path/long-names.xlsx npm test
npm run regression:names -- /path/long-names.xlsx work/name-regression
```

The runner checks Name segmentation, truncation, line capacity and labeled Address1 placement cases through actual processing, and writes a comparison workbook. Synthetic scenario metadata is used only by the test runner, never by the application parser.
