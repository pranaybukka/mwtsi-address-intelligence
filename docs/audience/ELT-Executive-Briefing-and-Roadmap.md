# MWTSI Address Intelligence
## Executive briefing, readiness roadmap and pilot scorecard

**Application baseline:** v1.4.0  
**Documentation revision:** 1.1 — 7 November 2026  
**Audience:** Executive Leadership Team and business sponsors  
**Status:** Initial decision-support material. Ownership, policy, targets, funding and dates below are proposals for discussion, not approved commitments.

## 1. Executive briefing

MWTSI Address Intelligence provides a local workflow for converting inconsistent beneficiary address text into proposed Hybrid address output. It keeps original source data, shows evidence and confidence, applies fixed transformation priorities, supports human acceptance without mandatory corrections, and exports either detailed analysis or a concise source-plus-Hybrid file.

The business opportunity is to reduce repeated spreadsheet manipulation, make transformations consistent and make decisions easier to explain. Those benefits are hypotheses to measure in a pilot. No validated operational savings, return on investment, production accuracy or risk-reduction figure is available yet.

The application is a working local implementation, not an enterprise-approved payment platform. The current release has automated engine/workflow verification and reproducible synthetic data. It still needs governed reference data, independent operational evaluation and enterprise deployment controls before broader reliance.

## 2. What is available now

| Capability | Current scope |
|---|---|
| Excel intake | Required source headers, up to 20 MB/50,000 rows; no assumption that Address1–3 have fixed street/city roles |
| Global architecture | Country aliases, postal formats, subdivisions and replaceable reference repository; limited seed locality coverage |
| Explainable proposals | Candidate values, heuristic confidence, evidence sources, alternatives and conflicts |
| Name interpretation | Known Name duplicates and explicit Address1 continuations considered before fixed rules; ambiguous content retained for review |
| Fixed Hybrid output | Independent deterministic engine, four-line profile, priority selection and loss/truncation audits |
| Operational decisions | Accept as-is, optional edits, rejection and whole-pending-batch acceptance |
| Source context | Group filtering/sorting, Group Details, Key Field and arbitrary extra columns preserved without address analysis |
| Export choices | Full analysis with evidence/history or one-sheet Source + Hybrid output |
| Test data | New 18,000-record synthetic set with 18 groups, unique keys, bank-country data and incomplete addresses |

The supplied country seed includes 249 ISO country entries but only 76 demonstration places. A globally extensible design is not the same as comprehensive global reference coverage or validated accuracy in every market.

## 3. Acceptance, validation and payment decisions

Acceptance records that an operator chooses to use or retain the proposed output. It does not change a failed check into PASS, increase confidence or independently verify the beneficiary’s location. A record can be accepted with unresolved town/country, conflicting evidence or a processing error, while those findings remain recorded.

This flexibility is an explicit business requirement. The process owner should define which purposes permit accepted-with-issues output, how the decision is documented and what downstream recipients need to know. The software does not require address corrections or a separate manager approval before acceptance/export.

Full analysis exposes the findings and review history. Source + Hybrid output intentionally omits generated validation and decision fields, so its presence does not prove a record was accepted or compliant. Downstream usage must be agreed separately.

PMPG/internal-profile PASS is not certification of a complete ISO 20022 message, postal deliverability, sanctions clearance or payment release authorization. Bank_Country may differ from the beneficiary’s country; selecting a bank-country candidate is not independent proof of party location.

## 4. Evidence and material limits

| Evidence | What it supports | What it does not establish |
|---|---|---|
| 95 automated tests passed; TypeScript/build passed | Documented engine boundaries, workflows, source preservation and export behavior in the tested environment | Complete defect absence, browser compatibility or enterprise security |
| Supplied 200-row workbook, 45% non-US | Regression coverage against known examples and documented rules | Representative operational accuracy; all expectations matching exactly |
| Workbook results: 199 profile PASS, one NAME_ONLY; all duplicate/length checks PASS | Internal structural/semantic checks on that input | Deliverability, bank acceptance or live payment outcomes |
| Zero unexplained regression failures; 119 classified interpretation/policy differences | Differences are disclosed rather than hidden | Exact reproduction of every interpretation worksheet field |
| Earlier pre-v1.4 engine run: 10,000 rows in 8.77 seconds | Initial indication for a repeated-locality engine workload | Excel/HTTP performance, concurrent users or full-gazetteer scale |
| Complete18,000-row Name corpus:7,200 placement cases identified; zero Name-focused failures | Evaluated Name segmentation, truncation audit, Name priority reservation and labeled Address1 cases | Independent global address accuracy or universal name recognition |

Browser/visual tests and Windows installation were not run in this session. Confidence scores are heuristic and require calibration on independent operational data. The current user/reviewer identity is not authenticated enterprise SSO.

## 5. Proposed risk register

Ratings below are proposed discussion priorities, not the results of a formal enterprise risk assessment.

| Risk and proposed priority | Current exposure | Proposed owner and response |
|---|---|---|
| Reference coverage — High | Unknown places or ambiguous matches can require review; seed is small | Data steward: acquire, license and validate priority-market reference data |
| Unverified confidence — High | Scores are explainable heuristics, not calibrated error probabilities | Model/process owner: compare to independently labeled operational samples |
| Accepted exceptions — High | Acceptance can close review while system findings remain | Operations/risk owner: define permitted uses and track accepted-with-issues separately |
| Access and identity — High | Local single-user app, typed reviewer name, no role enforcement | IT/security: design SSO, authorization, batch access and authenticated audit identity |
| Concise-file misuse — High | Source + Hybrid output omits review/validation fields | Business owner: agree downstream acceptance criteria and evidence handoff |
| Banking-country mismatch — High | Bank location can differ from beneficiary location | Data/risk owner: review authority policy and unresolved/conflict treatment |
| Information loss — Medium/High | Four-line priorities may drop lower-priority content | Operations/integration owner: monitor dropped/truncated data and validate receiving-system needs |
| Availability and recovery — Medium | Local SQLite and operational support arrangements | IT: durable storage, monitored service, backups, restore/rollback exercises |
| Scale and portability — Medium | Synchronous processing, complete-batch UI payloads, native dependency | IT: verify Windows/browser behavior and realistic file/load/concurrency scenarios |

There is no implemented Group-based access restriction, automated retention/deletion policy, encryption/key-management system, payment control or sanctions engine. Existing organizational controls should not be assumed to be present inside this app.

## 6. Proposed rollout roadmap

No dates, budgets or implementation commitments are assigned in this document. Move between phases based on evidence and accountable owner decisions.

| Phase | Proposed work | Suggested exit evidence |
|---|---|---|
| 1. Scope and ownership | Select business purpose, countries, data classifications, sponsors and support owners | Written use-case boundaries and named owners |
| 2. Controlled evaluation | Run synthetic scenarios and a permissioned, independently labeled operational sample | Reconciled keys/counts, defect log, correctness results and observed reviewer effort |
| 3. Data and policy | Govern reference sources; calibrate thresholds; define acceptance and downstream use policy | Approved reference provenance and documented decision policy, including accepted exceptions |
| 4. Enterprise hardening | Add identity/access, retention, secure hosting, logging controls and recovery; verify browser/Windows/load behavior | Security, support, restore and UAT evidence for the intended operating model |
| 5. Limited production pilot | Restrict scope, monitor outcomes, review exceptions and downstream rejections | Stable metrics and documented business/risk decision on expansion |
| 6. Scale decision | Assess queueing, pagination, database migration and broader markets | Capacity evidence and a funded support/data roadmap |

The current software remains available for local evaluation. This roadmap describes a proposed enterprise transition, not additional gates that block acceptance inside the app.

## 7. Proposed pilot scorecard

Establish baseline, denominator, sampling method and target before using the scorecard for a rollout decision. No targets are invented here. Use Full analysis and controlled external reconciliation; the app does not calculate every measure below automatically.

| Measure | Suggested definition and evidence |
|---|---|
| Throughput | Time from upload start to export availability for a stated row count, file size and environment |
| Automatic processing rate | AUTO_TRANSLATED rows divided by address-bearing source rows; report NAME_ONLY and ERROR separately |
| Independently verified correctness | Country/town correctness on a labeled sample, stratified by country, input scenario and automation status |
| Pending review rate | Pending review-state rows divided by total selected rows at a stated point in time |
| Accepted-with-issues rate | ACCEPTED rows retaining system findings divided by all accepted rows; also report as a share of total rows |
| Reviewer effort | Observed active review minutes per 100 records and per exception; measure externally |
| Evidence conflicts | Rows with banking/address or other evidence conflicts, by Group and market |
| Data loss | Rows with priority-dropped or truncated content, with root causes and downstream impact |
| Source preservation | Reconciled business keys, original values and extra-column retention in each export option |
| Downstream rework | Receiving-system rejection/repair rate linked to Key Field; payment outcomes are not produced by this app |
| Reliability | Processing errors, incidents, restore results and stale-decision conflicts in the intended environment |

Do not count accepted-with-issues rows as validation passes or automatic translations. Keep raw system status, review decision and independently verified correctness as separate dimensions. Group can support operational reporting but is not a security or authorization measure.

## 8. Business case and decisions requested

A business case can compare observed baseline handling time and rework with pilot results. Calculate net benefit only after including reviewer effort, reference-data acquisition/maintenance, hosting/support, security hardening, training and integration costs. A free external enrichment API is not required, but reference and operating costs still need assessment.

Suggested leadership decisions are: appoint the business and technical owners; approve a controlled evaluation scope and data boundary; identify the owner of acceptance policy and downstream obligations; authorize measurement of an independent sample; and determine what production-readiness evidence is required. Funding, schedule and rollout decisions should follow that evidence rather than the synthetic demonstration alone.

For implementation detail, use the IT guide. For operator instructions, acceptance scope and the field dictionary, use the Operations guide. This briefing summarizes current evidence and proposed next steps; it is not a compliance opinion or production approval.

## 9. Name-handling improvement and remaining boundary

The long-name dataset exposed a pre-transformation gap: the fixed Name limits worked on the Name field, while misplaced Name information in Address1 was treated as address content. v1.4 adds evidence/audit-based interpretation before those same fixed priorities. In the Name corpus,6,480 known duplicate cases and720 new continuation cases were identified.15,078 rows produced two Name records after interpretation;1,800 over66 Names had truncation audited.

New continuations and ambiguous content retain review findings; acceptance remains an operational decision. This is a targeted improvement supported by synthetic cases, not a claim that every global personal, organizational, street or building name can be automatically distinguished. Previously stored decisions are not recalculated without a new upload.
