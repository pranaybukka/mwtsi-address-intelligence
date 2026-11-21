# Test strategy

`npm test` runs deterministic boundaries, parser safety, all curated international markets, source-preserving Excel roundtrip, formula/format/size rejection, prefixed OOXML compatibility, review correction/approval/rejection and optimistic locking. Each test file uses an isolated temporary SQLite database. Synthetic/global tests are not proof of worldwide accuracy.

To include the supplied workbook in the automated suite:

```bash
REGRESSION_WORKBOOK=/path/hybrid_address_parser_v1_large_test_dataset.xlsx npm test
npm run regression -- /path/hybrid_address_parser_v1_large_test_dataset.xlsx work/regression
```

Without the environment variable the external-workbook test is explicitly skipped. Uploaded workbooks are excluded from source control and not bundled with the application. Runner processes actual rows, computes totals, verifies lengths/duplicates/safe automation and compares town/subdivision/postal/country to interpretation values. Address-field differences are allowed only if aggregate normalized text matches, or the sole addition is preserved C/O RECEIVING or ATTN ACCOUNTS routing content. Review flag policy differences are individually reported, not treated as matching expected outputs. See OPEN_QUESTIONS #4.

Reports include summary, nonUS percentage, unexpected failures and every interpretation difference. No counts are hard-coded. Supplied workbook contains90/200 nonUS cases (45%). It contains interpretation hints, not audited final Hybrid output; zero unexpected failures does not imply every interpretation field matches.

`npx tsx scripts/benchmark.ts 10000` runs a synthetic engine-only benchmark with unique street numbers and repeated US/German localities. It does not measure Excel/HTTP memory or a full gazetteer.

Playwright important workflows are in e2e/: upload→summary→record→export and edit→live preview→approval. Run `npx playwright install chromium`, then `npm run test:e2e` on a development machine or approved CI. Browser QA was not run in this managed session: Sites-managed environment lacked the required cua_repl browser tool and its skill disallows an alternate preview server/browser path. Build, TypeScript and server-side workflow tests provide verification without claiming visual or browser coverage.

Acceptance regression tests verify unresolved/fallback acceptance, banking conflicts, processing-error preservation, optional edits without asserted verification, exact proposal/evidence preservation, persisted Excel acceptance metadata, HTTP acceptance and stale/atomic batch rejection. Playwright cases cover accepting without edits and accepting all pending outputs (not run in this environment).

Column/Group tests cover importer→SQLite→acceptance→Excel preservation, strict exclusion of all metadata from intelligence and validation, text IDs with zeros, number formats, numeric zero, false, dates, blank extra columns, source/computed header collisions, late-only extra columns, inert formula handling, hyperlink audit metadata, unnamed/duplicate header rejection, metadata-only records, exact Group filtering and stable natural sorting, and Group-aware HTTP exports. A Playwright flow for Group/filter/export and extra-column inspection is provided but unrun.

Export-mode tests verify the legacy full/default three-sheet contract, exact concise column set, typed source values, Group/extras retention, source Hybrid-header collisions, stored accepted and name-only output, Group-aware HTTP selection in both modes, filename/invalid-mode behavior, and source text above the full-analysis display threshold. A Playwright export-selector/download/workbook flow is included but unrun in this managed environment.

Name regressions cover known duplicate/prefix removal, new joint continuations, explicit labels, blank Name recovery, mixed/delimited Address1 layouts, Unicode, negative street/building/routing cases, reference-locality protection, original-versus-evaluated length, reviewer/API Name changes and both export contracts. NAME_REGRESSION_WORKBOOK adds a full external Name corpus test; without it the test is explicitly skipped. scripts/name-regression.ts streams a per-row comparison workbook and checks every processed Name's 33/66 segmentation, Name-tail audit and reserved line capacity. Scenario metadata supplies only test expectations, not parser evidence.
