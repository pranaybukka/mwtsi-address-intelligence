# v1.4.0 — Evaluate Name and Address1 before Hybrid transformation

- Add evidence/audit-based Name interpretation before locality/address parsing.
- Remove known duplicate Name fragments from Address1; propose explicit joint/labeled continuations.
- Preserve and flag ambiguous name/street/building/locality overlaps rather than silently guessing.
- Apply existing 33/66 limits and Name-first priorities to the evaluated Name; audit lost tails.
- Show evaluated Name, both 1/ records, classification evidence and truncation in review.
- Permit Name edits through the live preview and versioned review API.
- Add Name-specific Full analysis fields; keep concise source-plus-Hybrid export unchanged.
- Keep accept-as-is and whole-batch acceptance available without corrections.
- Provide full Name corpus regression and a before/after comparison workbook.
- Keep historical batches/decisions unchanged; reupload to apply new interpretation.

# v1.3.0 — Export options

- Add Full analysis and Source + Hybrid output selectors on results, review and export pages.
- Keep Full analysis as the default with Results, Summary and Audit worksheets.
- Offer a concise, single-sheet source/Group/extra-column export plus the four stored Hybrid lines.
- Honor Group filtering/sorting in both formats and preserve typed source data and header-collision handling.
- Keep unresolved and unaccepted proposals exportable; no required corrections.
- Expose mode=full and mode=source-hybrid through the existing export endpoint.

# v1.2.0 — Additional source columns and Group

- Preserve extra input columns in Results and source audit, including typed values and number formats.
- Analyze only Name, Address1, Address2, Address3 and Bank_Country using an explicit projection.
- Add Group as an immutable standard source field with exact filtering and natural ascending/descending sorting.
- Export the selected Group in the selected order; retain whole-batch acceptance behavior with explicit UI wording.
- Keep source values on header collisions by namespacing computed field headers; report mappings in Summary.
- Treat extra formulas as cached values or inert text; preserve original formula/hyperlink metadata in audit.
- Update input template, demonstration Groups and sample workbooks.
- Existing files and saved databases remain supported without migration. Reupload files if an earlier app version discarded their extra columns.

# v1.1.0 — Acceptance without required corrections

- Accept individual proposed output as-is, or optionally edit and accept.
- Accept every pending output in a batch with one reviewer note.
- Acceptance clears pending review, while retaining validation failures, fallbacks, conflicts, confidence, source data and processing status.
- Record the accepted lines and validation snapshot with reviewer, reason and timestamp.
- Show Accepted and Accepted with issues in results; include acceptance metadata and counts in Excel.
- Keep stale batch decisions atomic: no partial update when a selected record changed.
- Retain legacy verified approvals for backward compatibility.

## Update an existing local installation

Stop the app with Ctrl+C. Back up your existing data folder. Copy the updated source files into your application folder while keeping the existing data folder (and any configured external SQLite database). Run npm install, then npm run dev. The source ZIP excludes operational databases; no schema migration is needed.
