# Claims Knowledge Agent - Wiki Schema

This document defines the structure, conventions, and workflows for individual insurance claim wikis stored in GCS. Every claim is isolated under its own folder (`<claim_id>/`) at the root of the bucket.

## GCS Bucket Configuration
The primary storage bucket for all claim wikis is `[YOUR_WIKI_BUCKET_NAME]`.
Within the bucket, the directory structure is organized per claim:
- `[YOUR_WIKI_BUCKET_NAME]/<claim_id>/index.md`
- `[YOUR_WIKI_BUCKET_NAME]/<claim_id>/log.md`
- `[YOUR_WIKI_BUCKET_NAME]/<claim_id>/schema.md`
- `[YOUR_WIKI_BUCKET_NAME]/<claim_id>/...`

## Directory Structure (Per Claim)

The wiki for a single claim contains the following structured files and directories:

### Special Files (Root of Claim Folder)
- `index.md`: A complete catalog of all documents, assessments, and evidence for this claim.
- `log.md`: Chronological record of all updates, document ingestions, and adjuster assessments.
- `schema.md`: This file (active schema for reference).
- `gaps.md`: Auto-maintained list of missing information or pending documents (knowledge gaps).
- `sources/`: flat directory containing summaries of raw files ingested (emails, letters, PDFs, transcripts).

### Claim Information & Assessment Hierarchy
- `summary/`
  - `claim_overview.md`: General claim details (claim number, claimant, date of loss, description of loss, reserve amounts, status).
  - `policy_details.md`: Relevant insurance policy clauses, coverage limits, deductibles, and exclusions.
- `evidence/`
  - `statements/`: Transcripts or summaries of statements from claimant, witnesses, and third parties.
  - `official_reports/`: Police reports, accident reports, fire department assessments, weather logs.
  - `medical/`: Medical records, physician reports, treatment logs, hospital invoices (if applicable).
  - `media/`: Photos/videos of physical damage, scene layouts, or personal injuries.
- `assessments/`
  - `liability.md`: Liability assessment, fault breakdown, third-party liability indicators, and legal counsel memos.
  - `damage_valuation.md`: Repair estimates, total loss valuations, adjuster notes, and replacement quotes.
- `correspondence/`
  - Summaries of letters, legal notices, and call transcripts.
- `settlement/`
  - `offers.md`: Log of settlement offers made, accepted, or rejected.
  - `final_settlement.md`: Release forms, signed agreements, and actual payment records.

---

## Page Format

All markdown files in the claim wiki (except special files like `index.md`, `log.md`, `gaps.md`) MUST have YAML frontmatter at the top.

Example of a physical damage assessment:
```markdown
---
title: Front Bumper Repair Estimate
created_at: 2026-05-15T10:00:00Z
updated_at: 2026-05-15T10:15:00Z
sources: [est_invoice_9847]
tags: [damage-valuation, repair-estimate, auto-body]
status: active
confidence: 1.0
evidence_count: 1
contested: false
relationships:
  - target: "summary/claim_overview.md"
    type: "part_of"
    description: "Estimates physical damage costs for the overall claim reserve"
  - target: "evidence/official_reports/police_report.md"
    type: "supports"
    description: "Estimates match damage description detailed in the police report"
---

# Repair Estimate - Front Bumper

Detail of the bumper damage estimate from Elite Auto Body...
```

---

## Linking Convention

To ensure links render correctly and navigate seamlessly in the Web UI:
1. **ALWAYS use standard Markdown links**: Use `[Label](relative_path.md)` format.
2. **NEVER use WikiLinks**: Do NOT use Obsidian-style brackets like `[[target_path|Label]]` or `[[target_path]]`.
3. **Always use relative paths**:
   - If linking to a file in the same directory: `[Policy Details](policy_details.md)`
   - If linking to a file in another directory: `[Eleanor Vance](../entities/eleanor-vance.md)`
   - Ensure relative paths always resolve correctly from the file's directory.

---


## Relationship Type Ontology

All `relationships` entries MUST use one of the following controlled types.

| Type | Meaning |
|------|---------|
| `supports` | Provides corroboration, proof, or evidence for an assessment or value |
| `part_of` | A component of a larger concept, overview, or overall valuation |
| `contradicts` | Contains claims or descriptions that conflict with another page |
| `supersedes` | Replaces or deprecates a prior estimate, report, or statement |
| `uses` | Relies upon another page's calculations, parameters, or definitions |
| `relates_to` | General conceptual connection (use sparingly) |

Each relationship entry must include a `description` field explaining why the relationship exists.

---

## Confidence Scoring

Every knowledge page MUST include a `confidence` score (0.0–1.0).

| Range | Meaning |
|-------|---------|
| 0.9–1.0 | Official reports (police, hospital), signed policies, final contractor estimates |
| 0.7–0.9 | Witness statements, adjuster field notes, preliminary repair estimates |
| 0.5–0.7 | Claimant descriptions, third-party assertions, unverified media descriptions |
| 0.0–0.5 | Speculative assessments, contested claims, or empty stub pages |

---

## Workflows

### Ingest
When a new document is ingested:
1. Create a summary page in `sources/` named after the file ID.
2. Extract entities (claimants, vehicles, dates, locations) and facts.
3. Update/create pages under the correct subdirectory (`evidence/`, `assessments/`, etc.).
4. Map explicit relationships (e.g. linking statements to the liability assessment).
5. Update `index.md` with the new page links.
6. Append an entry to `log.md`.

### Query
When answering a question:
1. Consult `index.md` to find relevant files.
2. Read the relevant pages and follow their explicit frontmatter `relationships`.
3. Synthesize a grounded answer, citing evidence and confidence scores.
