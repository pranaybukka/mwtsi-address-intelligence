# Architecture

ExcelJS import → normalized free-form containers → indexed global reference lookups → evidence candidates → structured candidate → pure Hybrid candidate generator → fixed priority selector → separate validator → status/review queue → audited Excel export.

Engine A lives in parser/ and enrichment/. It uses ReferenceRepository (reference/types.ts); SqliteReferenceRepository is the initial adapter. Country selection follows configurable authority order, while conflicts block automation. The generic parser recognizes independent locality tails in any field; postal formats and country aliases are data-driven. No universal US street/city/state assumption is made.

Engine B lives in hybrid/. It receives only StructuredAddress and returns candidates, final lines, dropped data and truncation entries. It has no database, country lookup, external network, AI or confidence dependencies. The validator checks the internal slash profile and source semantics separately.

SQLite stores reference data, batches, per-record payloads, versions, and append-only review events. Record updates and review event insertions share a transaction; optimistic version comparisons reject stale decisions. Original source values remain immutable. Review identity is a local operator assertion, not authenticated SSO.

Next.js Node APIs ingest files, persist results, validate edits and export. Client React handles upload, summary filters, exception queue, evidence, audit, live deterministic edit preview and export. Client previews are advisory; server validation governs approval.

The initial upload is synchronous with a 50,000-row/20MB limit. A long-running internal Node service is appropriate. A queued worker and paginated record API are recommended for multi-user/large-scale deployment; the current UI receives one batch JSON and paginates rendering. No external providers are enabled. AddressValidationProvider defines a future evidence-only integration boundary.

Acceptance is an independent review decision. Single-record ACCEPT persists the exact proposal and findings; batch acceptance runs in one SQLite transaction over a versioned explicit pending selection. Accepted-output snapshots are stored in review events and exported. Accepted exceptions remain distinct from validation PASS and automatic translation.

The source envelope now contains Group plus typed additionalColumns entries (original header, value, number format and optional original formula/hyperlink). analysisInput explicitly projects the five analyzed fields before Engine A, preventing Group and extras from influencing even normalization notes. SQLite JSON persistence and review retain the complete envelope. Excel export unions extra headers across all records, restores dates and numeric formatting, and namespaces computed header collisions. Group selection/sort helpers are shared by the UI and export API.

ExportMode is shared by UI and server. The server validates mode independently and defaults to full for backward compatibility. Source + Hybrid uses a lightweight projection of source data and stored Hybrid lines and returns before constructing Summary/Audit; it does not serialize the analysis or recompute the transformation. Header collision and typed source-cell handling are shared across formats.

The v1.4 Name interpretation module (parser/name.ts) consumes only Name and Address1 inside the five-field intelligence boundary. An enrichment-supplied indexed locality guard prevents geographic text from being automatically removed as a Name duplicate. Interpretation yields a Name candidate, cleaned source containers, review reasons and a separate action audit. No fixed Hybrid rules were made probabilistic. Name edits pass through the same normalized preview and server-side rules. Legacy records remain readable and are not silently reprocessed.
