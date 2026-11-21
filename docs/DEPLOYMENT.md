# Deployment

Use Node22 or24 LTS on a local/internal server with durable writable disk and native better-sqlite3 support. Install compiler tools if the platform cannot use a prebuilt binary. SQLite is not suitable for ephemeral edge Workers. Do not deploy this stateful app to an ephemeral/serverless filesystem.

```bash
npm ci
npm run db:seed
npm test
npm run build
npm start -- --hostname 127.0.0.1
```

`ADDRESS_DB_PATH=/secure/path/address.db` selects database location. Back up using SQLite online backup or a stopped service (include WAL appropriately); test restoration. Protect source/data paths, never place database or uploads under public/. Uploads are not retained as files; original row data, results and review history are persisted locally. Export contains sensitive source data; handle under the organization's data policy. No full addresses are logged by application code. No external validation calls are made.

This release is a functioning local single-user implementation. Before enterprise exposure: integrate SSO and authenticated reviewer identity; enforce roles and access separation; scope batch authorization per user/team; configure TLS, request/rate limits, encryption and retention/deletion; queue large imports; use paginated APIs; validate reference datasets and confidence thresholds; conduct independent security, accessibility, concurrency and load reviews. A typed reviewer name is not authenticated identity. Current same-origin mutation checks are a local CSRF measure, not enterprise authorization.

Upload limits20MB/50k rows and150MB advertised ZIP expansion. XLSX only, no macros/external links; formulas in analyzed fields/Group are rejected. Extra-column formulas are treated as inert source data and never executed. ExcelJS/JSZip parse locally, no embedded code execution. Resource isolation remains recommended for hostile inputs; ZIP metadata checks are not a complete sandbox.

Private/internal service only. No publication or external address transfer was requested or performed. For later database migration implement ReferenceRepository and replace operational SQLite repositories/transactions with equivalent durable semantics. Threshold policy is in domain.ts; review changes in policy with regression validation.
