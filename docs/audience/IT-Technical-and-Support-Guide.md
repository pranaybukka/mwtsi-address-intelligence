# MWTSI Address Intelligence
## IT technical, deployment and support guide

**Application baseline:** v1.4.0  
**Documentation revision:** 1.1 — 7 November 2026  
**Audience:** IT delivery, infrastructure, application support and security  
**Status:** Initial working documentation. Proposed enterprise controls require organizational decisions; they are not represented as implemented features.

## 1. What IT is receiving

MWTSI is a functioning local, single-user application for address remediation. It reads Excel input, proposes structured address components with evidence, applies a deterministic internal Hybrid slash profile, supports acceptance with or without corrections, and exports Excel results. Excel is the interchange format; Node.js runs the application.

The private download page distributes packages and synthetic datasets. It does not host the operational Node/SQLite application. Downloading a package does not install or update an existing local copy.

| Component | Technology and purpose |
|---|---|
| Web application | Next.js 16, React 19, strict TypeScript |
| Runtime | Node.js; Node 24 LTS is the documented installation target |
| Persistence | SQLite through better-sqlite3; local database and review history |
| Excel processing | ExcelJS; JSZip for archive/OOXML compatibility |
| Reference metadata | i18n-iso-countries plus curated place, subdivision and postal examples |
| Interface | CSS and Lucide React icons |
| Automated checks | Vitest, TypeScript checking and Next.js production build |
| Browser checks | Playwright flows supplied; not executed in this managed session |

No AI model or paid address-validation API is required or used. No external enrichment provider is enabled. Ordinary dependency installation and reference-data acquisition are separate IT activities involving external sources.

## 2. Architecture and data boundaries

The processing path is: XLSX validation → five-field projection → Name/Address1 interpretation → normalization and enrichment → structured proposal → deterministic Hybrid engine → separate validation → review decision → export.

Engine A interprets Name, Address1, Address2, Address3 and Bank_Country using country aliases, postal patterns and indexed place relationships. Scores are explainable heuristics, not calibrated probabilities. Group and all additional columns are excluded from address analysis, including normalization notes.

Engine B receives normalized components and performs fixed candidate construction, segmentation, truncation and priority selection. It has no database, network, AI or country/town inference dependency. The validator checks the internal slash profile separately. Improvements to reference data should not alter the fixed Hybrid priorities.

| Code area | Responsibility |
|---|---|
| src/lib/parser and enrichment | Normalization, locality interpretation and evidence |
| src/lib/hybrid | Candidate generation, priorities, truncation, transformation and validation |
| src/lib/reference | ReferenceRepository interface and indexed SQLite adapter |
| src/lib/source.ts | Explicit analyzed-field projection and shared Group filtering/sorting |
| src/lib/excel | Safe import, typed extra-column preservation and both export formats |
| src/db | Connection, schema, seed, batch persistence and review transactions |
| src/app/api | Upload, retrieval, review, batch acceptance, template and export endpoints |
| src/components/Workspace.tsx | Operational workflow, Group controls and live edit preview |

The reference interface supports a later database adapter. Operational SQLite repositories and transaction semantics must also be migrated for a different enterprise database; changing only the reference adapter does not migrate the whole application.

## 3. Installation and Windows quick start

Target Windows 10/11 with Node.js 24 LTS. Windows installation has not been verified in this session. Linux/Node 24 was the recorded verification environment.

1. Install Node.js 24 LTS using the official installer and normal IT-approved software procedures.
2. Extract the application ZIP into an approved local folder, for example C:\MWTSI\hybrid-address.
3. In File Explorer, open that folder, type cmd in the address bar and press Enter.
4. Run the following from the application folder. The package.json file must be in the current directory.

```bat
node --version
npm --version
npm install
npm run dev
```

Open http://localhost:3000. Keep the command window open; Ctrl+C stops the local application. If PowerShell blocks npm.ps1, use Command Prompt or npm.cmd under organizational policy; do not weaken execution policy as a default repair.

better-sqlite3 is a native dependency. If its prebuilt binary cannot be used, installation may require supported compiler tools and Python. Capture the actual install error, Node version and CPU architecture, and use approved build-tool installation rather than bypassing security settings.

## 4. Managed internal deployment

For a controlled non-development service, use durable writable storage, an approved Node 24 runtime, the lockfile and a supervised process. Run all commands with the application folder as working directory; schema and default data paths depend on it.

```bat
npm ci
npm run db:seed
npm test
npm run build
npm start
```

The scripts bind to 127.0.0.1 by default. A shared internal service requires deliberate network/service configuration, authentication and TLS design; those controls are not delivered by changing the bind address. Do not expose the present single-user app directly to the internet.

| Setting | Current behavior |
|---|---|
| ADDRESS_DB_PATH | Optional path to the SQLite database; default is data/address.db relative to the application directory |
| Thresholds and authority order | Source configuration in src/lib/domain.ts; no administrative settings screen |
| Upload size | 20 MB compressed XLSX |
| Rows | Maximum 50,000 source rows per upload |
| Archive checks | Advertised ZIP expansion maximum 150 MB; entry limits and macro/external-link rejection |
| Reference initialization | Lazy seed on first processing; db:seed initializes explicitly |
| External enrichment | Disabled; a provider interface exists for future evidence integrations |

Example persistent database setting in Command Prompt:

```bat
set "ADDRESS_DB_PATH=C:\MWTSI-Data\address.db"
npm start
```

Use an absolute path under the intended service identity. If using a service manager, configure the same working directory, environment and filesystem permissions there. SQLite is not suitable for an ephemeral deployment filesystem. Queued imports and paginated APIs are future scale improvements; the current UI receives a complete batch JSON payload.

## 5. Data storage, backup and recovery

The database stores country/place references, original source values, Group, typed extra columns, processing results, versions and review events. Uploaded workbook files are not retained by the app, but their extracted source data is persisted. Exports are separate sensitive files. Retain original input workbooks according to an approved business policy outside the app.

SQLite uses WAL mode. Copying only a live address.db file can omit committed data in the WAL. Use an approved online SQLite backup method, or the stopped-service procedure below.

**Stopped-service backup**

1. Stop the application and confirm no process can write to the database.
2. Copy the entire data directory, including any SQLite sidecar files, to an access-controlled backup location. For ADDRESS_DB_PATH, back up that database and its associated files instead of assuming the default folder is active.
3. Record application version, database location, backup time and operator. Define retention and encryption requirements locally; no retention schedule is automatically enforced.
4. Restart the app and check that the expected batch can be opened.

**Recovery exercise**

Restore the complete backup into an isolated copy of the same application release. Start it against the restored database, verify batch counts and source values, open one acceptance history, and generate both export formats. Record the result before approving the backup process for operational reliance. Do not overwrite the live database to perform the first restore test.

## 6. Upgrade and rollback runbook

1. Stop the current application and take a recoverable backup.
2. Record the application version and active database path.
3. Extract the new ZIP separately. Copy application source files while retaining the existing data folder and any external database path. Application ZIPs intentionally exclude operational databases.
4. Run npm install, npm run build and the agreed release checks; start the app.
5. Verify an existing batch, a new small upload, Group filtering, accept-as-is and both exports.

v1.1–v1.4 use existing JSON record persistence without a required database migration. That is not a promise for future versions. Review future release notes before replacing source files. To roll back, stop the service and restore the prior code and the matching backup according to a tested recovery plan; do not assume every future data format is backward-compatible.

## 7. Reference-data maintenance

The seed contains 249 ISO country entries and 76 demonstration places. This is not a comprehensive global address or postal inventory. Unknown localities and ambiguous matches can remain unresolved or go to review.

GeoNames-compatible loaders accept populated-place dumps and separate postal dumps. Download and license the correct dataset separately; record version, provenance, attribution and quality checks. Do not interchange the two file formats.

```bat
npm run db:import -- places "C:\ReferenceData\allCountries.txt"
npm run db:import -- postal "C:\ReferenceData\postal-allCountries.txt"
```

Imports stream and transact in chunks. Restart the app after importing to clear cached reference lookups. Reconcile source subdivision identifiers and duplicate locality identities before relying on automation. Loading both dumps can introduce duplicate place identities that cause conservative review. Test in a copied database first and retain a rollback path.

## 8. Security and production-readiness assessment

| Current implementation | Additional production work and evidence |
|---|---|
| Local-only processing and no external enrichment calls | Approve the actual hosting boundary and permitted data flows |
| Same-origin mutation checks | Add authenticated sessions, authorization and tested CSRF/session controls |
| Typed reviewer name and reason | Bind reviewer identity to SSO; the current text field is self-asserted |
| SQLite transactional updates and version checks | Validate concurrent-user operation, batch scope and role separation |
| No address logging in application code | Review infrastructure logs, diagnostics, monitoring and support practices |
| XLSX validation; no macro execution | Resource-isolated hostile-file testing, rate limits and dependency review |
| Original source and review history retained | Define encryption, access, retention, disposal and backup governance |
| Full analysis export includes findings | Define export access, secure distribution and downstream usage controls |

Group is a filter, not an access-control boundary. Anyone with access to this local app/database is not restricted to one Group by the implementation. No SSO, role enforcement, automated retention/deletion workflow, application encryption/key-management system, payment release control or sanctions screening is delivered.

Internal Hybrid validation is not certification of a complete ISO 20022 message. Transport character-set constraints and downstream payment-system acceptance need separate integration verification. Country/town heuristics require calibration on independent operational data.

## 9. Testing and release evidence

Recorded v1.4 results: 95 Vitest tests passed across ten files, TypeScript checking passed and the Next.js production build passed. Browser/visual tests and Windows installation were not run. The supplied 200-row workbook includes 90 non-US rows; it produced 199 internal-profile validation passes, one NAME_ONLY/not-applicable row, 200 duplicate passes and 200 length passes, with zero unexplained regression failures. There are 119 documented interpretation/policy differences; zero unexplained failures does not mean exact agreement with every expected worksheet field.

An earlier pre-v1.4 synthetic engine-only run processed 10,000 rows in 8.77 seconds. It used repeated localities and unique street numbers; it is not an end-to-end Excel/HTTP, enterprise load, multi-user or full-gazetteer benchmark.

```bat
npm test
npm run typecheck
npm run build
set "REGRESSION_WORKBOOK=C:\TestData\supplied.xlsx"
npm test
npm run regression -- "C:\TestData\supplied.xlsx" work\regression
```

Without REGRESSION_WORKBOOK the external-workbook test is explicitly skipped. To run the supplied Playwright flows on a permitted development/CI machine, install the approved browser dependency and use npm run test:e2e. Agree independent Windows, accessibility, browser, security, load and recovery acceptance tests before production approval.

## 10. Application interfaces

These are local application APIs, not a separately authenticated enterprise integration contract.

| Endpoint | Purpose |
|---|---|
| POST /api/batches | Multipart XLSX upload and synchronous processing |
| GET /api/batches | Recent batch metadata |
| GET /api/batches/{id} | Complete stored batch |
| PATCH /api/records/{id} | Versioned review action, reviewer, reason and optional edits |
| POST /api/batches/{id}/accept | Atomic acceptance of explicitly selected pending record IDs and versions |
| GET /api/batches/{id}/export | XLSX output with mode and Group selection |
| GET /api/template | Input template |
| POST /api/demo | Synthetic demonstration batch |

Export mode is full (default) or source-hybrid. Group filters use group=<exact value> or groupMissing=1; groupSort is original, asc or desc. Do not specify both a named Group and the missing-Group filter. Single-record ACCEPT permits findings without edits. Legacy APPROVE remains for verified approvals and is not required by the current UI. Batch acceptance validates versions and rolls back the whole selection if stale; it does not partially accept the remainder.

## 11. Support triage

| Symptom | First checks | Safe next action |
|---|---|---|
| npm or node not found | New terminal, PATH, approved Node installation | Reopen Command Prompt; verify node --version and npm --version |
| Native dependency install fails | Exact error, Node version, architecture, build-tool availability | Escalate to IT with sanitized logs; do not disable TLS or endpoint protection |
| localhost:3000 unavailable | Service window, working directory, port-in-use message | Start the correct app instance; capture startup error without address data |
| Database cannot open | Active path, permissions, disk space, working directory | Restore intended permissions/path; do not delete the database as a repair |
| Workbook rejected | XLSX extension, headers, duplicate/unnamed columns, formulas and limits | Correct input structure; additional fields must have names |
| Many unresolved localities | Reference coverage and provenance | Review/enrich reference data; do not raise confidence arbitrarily |
| Stale review conflict | Another decision changed a selected record version | Reload the batch and reassess; do not blind-retry an old selection |
| Export has fewer rows | Group selection and sort controls | Set All groups for whole-batch export; search/status filters are screen-only |
| Expected extra columns missing | Upload performed before v1.2 | Reupload the original workbook; discarded columns cannot be reconstructed |

When raising an incident, include release, operating system, Node version, batch/record identifiers, sanitized error, expected versus actual behavior and reproduction steps. Use synthetic examples where possible. Do not email full banking-related source files or database copies by default.

## 12. Proposed operational handoff checklist

IT and the business owner should assign named owners, approve deployment/data boundaries, verify Windows/browser behavior, test restore and rollback, govern reference data, approve confidence/acceptance policy, define support routes and establish monitoring before enterprise use. These are proposed readiness activities, not existing approval gates inside the application.

For detailed implementation references, consult README.md and docs/ARCHITECTURE.md, HYBRID_RULES.md, REFERENCE_DATA.md, TEST_STRATEGY.md, OPEN_QUESTIONS.md and VERIFICATION.md in the source package.

## 13. Name interpretation update (v1.4)

The new Name module evaluates the dedicated Name field with Address1 before locality parsing. It can remove known Name duplicates and propose explicit joint/labeled continuations, with before/after audits. Arbitrary alphabetic, building/street or geographic overlaps are retained for review. No extra columns or synthetic scenario labels are used by the parser. The fixed engine still retains first66 code points, splits33/33 and reserves Name records before optional address candidates.

New Full analysis fields expose the evaluated Name, original/evaluated lengths, confidence/source, interpretation check, evidence, actions, review reasons and Name truncation. Reviewer/API Name edits use normalized preview and the same engine. Acceptance without correction remains supported. Existing persisted batches are not automatically recalculated; reupload original files for the new checks.

With NAME_REGRESSION_WORKBOOK set, npm test also processes the full Name corpus. Or run npm run regression:names -- input.xlsx work/name-regression. The18,000-row long-name/Address1 corpus had zero processing errors and zero Name-focused failures; all7,200 labeled Address1 Name cases were identified. These checks do not certify all address components or browser/Windows behavior.
