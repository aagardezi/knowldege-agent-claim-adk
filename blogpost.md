# Evolving Claims: Why the Active Knowledge Wiki Pattern Outperforms Traditional RAG for Evolving Complex Domains

*Author: insurance-agent-claim-adk Team*
*Date: May 2026*

---

## Abstract

In industries like insurance, healthcare, and legal tech, data is rarely static. An insurance claim is a living, temporal story. Over weeks or months, a single claim evolves from a simple **Policy Declaration** and **First Notice of Loss** into a complex web of **witness statements, adjuster notes, police records, repair invoices, medical assessments,** and **settlement negotiations**. 

When organizations attempt to build AI decision-support systems for these domains, they almost always reach for **Retrieval-Augmented Generation (RAG)** using Vector Databases. However, for temporal, state-driven data, traditional RAG quickly falls flat, leading to conflicting citations, chronological blindness, and dangerous hallucinations.

This blog post introduces a superior alternative: the **Active Knowledge Wiki Pattern**. Developed using the **Google Agent Development Kit (ADK)**, deployed on **Vertex AI Agent Platform**, and visualized via an interactive **Next.js graph dashboard**, this pattern replaces black-box vector searches with a self-organizing, persistent, and human-auditable Knowledge Wiki stored in Google Cloud Storage (GCS).

---

## The Temporal Failure of Traditional RAG

To understand why the Active Knowledge Wiki is a major step forward, we must first diagnose why traditional vector-based RAG fails in complex, evolving domains.

Traditional RAG works by chunking documents, generating high-dimensional vector embeddings, and storing them in a Vector Database (like Vertex AI Vector Search or pgvector). When a user asks a query, the system retrieves the top-$K$ most semantically similar chunks.

For a static dataset (e.g., a company's policy handbook), this works well. But for an **evolving insurance claim**, vector distance suffers from three critical flaws:

1. **Chronological Blindness**: Vector embeddings capture semantic meaning, not time. If an adjuster writes on Day 1 that a claimant is *"100% at fault"* based on a preliminary estimate, but a comprehensive police report on Day 15 proves they are *"0% at fault"*, a vector database treats both statements as highly semantically relevant. When the LLM reads both chunks, it struggles to resolve the contradiction, often blending them together or hallucinating the wrong conclusion.
2. **Loss of Structural and Ontological Context**: Claims documents aren't isolated chunks. A medical invoice *supports* a bodily injury claim; a police report *contradicts* a driver's statement. Traditional RAG shreds these structural connections, rendering the relationships invisible to the retrieving agent.
3. **No Hallucination Isolation on Missing Data**: If a crucial document (e.g., a final repair estimate) has not yet been received, a vector search will still dutifully return the "closest" semantic matches—which might be unrelated preliminary estimates or general policy terms. The LLM, seeing this "relevant" data, is highly prone to hallucinating that the estimate is complete.

---

## The Active Knowledge Wiki Architecture

The **Active Knowledge Wiki Pattern** solves these challenges by storing knowledge not as raw, disconnected vector chunks, but as a **persistent, interlinked, self-organizing Wiki** structured inside Google Cloud Storage (GCS). 

Instead of searching vector space, an intelligent, multi-agent pipeline incrementally builds, reviews, and curates a comprehensive knowledge base for each individual claim.

```mermaid
graph TD
    A[Raw Claim Documents: PDFs, Emails, Images] --> B[Extractor Agent]
    B -->|Extracts Multimodal Facts| C[Synthesizer Agent]
    
    subgraph GCS Persistent Claim Wiki [gs://my-wiki-bucket/CLM-2026-001/]
        D[index.md]
        E[log.md]
        F[schema.md]
        G[Wiki Subdirectories: evidence/, assessments/, summary/]
    end

    C -->|1. Reads active Schema| F
    C -->|2. Surveys active Wiki| G
    C -->|3. Writes interlinked Markdown with YAML frontmatter| G
    
    C -->|Returns file manifest| H[Reviewer Agent]
    H -->|Checks consistency & Contradictions| G
    H -->|Returns Review Report| I[Librarian Agent]
    
    I -->|Updates nav catalog| D
    I -->|Appends history trace| E
    
    J[Next.js Web UI Graph Dashboard] -->|Read-only access via IAP & GCS| GCS Persistent Claim Wiki
    K[Orchestrator Scoped Query] -->|Metadata-Aware Auditing| GCS Persistent Claim Wiki
```

### The Multi-Agent Pipeline (ADK-Powered)

The architecture utilizes a hierarchical orchestrator that coordinates four specialized, containerized agents:

1. **Multimodal Extractor Agent**: Leverages Gemini’s native vision capabilities to ingest raw PDFs, images, and audio directly, bypassing brittle external OCR pipelines. It extracts raw, structured facts.
2. **Synthesizer Agent**: Integrates the new facts into the wiki. It writes beautiful Markdown files inside a strict, schema-compliant claim directory (e.g. `evidence/`, `assessments/`, `summary/`). Crucially, it appends high-fidelity **YAML frontmatter** metadata to every file:
   ```yaml
   ---
   title: Front Bumper Repair Estimate
   created_at: 2026-05-15T12:00:00Z
   updated_at: 2026-05-15T12:02:00Z
   sources: [invoice_9847]
   tags: [damage-valuation, repair-estimate]
   status: active
   confidence: 1.0
   evidence_count: 1
   contested: false
   relationships:
     - target: "summary/claim_overview.md"
       type: "part_of"
       description: "Estimates physical damage costs for overall claim reserve"
   ---
   ```
3. **Reviewer Agent**: Scans the Synthesizer's output manifest and performs cross-document consistency audits. If it detects a conflict (e.g., two invoices claiming different repair amounts), it sets the `contested: true` flag on the affected pages.
4. **Librarian Agent**: Acts as the governance engine. It maintains the **`index.md`** (a complete, hierarchical navigation catalog of the claim's files) and the **`log.md`** (an immutable, chronological audit trail of every ingestion and status change).

---

## A Major Leap Forward: Core Advantages Over RAG

By transitioning from Vector RAG to the Active Knowledge Wiki, organizations achieve four major architectural breakthroughs:

### 1. Chronological and Log-Driven Awareness
Because the Wiki includes a structured `log.md` and `updated_at` timestamps, the retrieving Orchestrator knows exactly what the *latest* state of the claim is. It will never fetch a stale Day 1 fact and present it as active if a Day 15 update exists.

### 2. Strict Hallucination Containment (Active Stubs)
If a required document is missing, the Librarian creates an empty **Stub Page** with `status: stub`. 
The Orchestrator is configured with **strict anti-hallucination safety rules**: when resolving queries, it must **completely ignore the text body of stubs**. Instead of fabricating answers, the agent reports an explicit, actionable information gap: *"The police report has not yet been ingested (status: stub), so details are currently unavailable."*

### 3. Contested Fact Isolation
If facts conflict, the Reviewer flags the files as `contested`. When answering user questions, the Orchestrator detects this flag and presents both sides of the dispute transparently: *"According to the witness statement, the vehicle light was red; however, the physical damage assessment (contested) indicates impact points consistent with a green light collision."*

### 4. Complete Auditable Citations
Every single piece of synthesized knowledge is explicitly linked to its original raw GCS source document. Auditing an LLM's conclusion is as simple as clicking a link in the Markdown file to view the raw source file or the specific page within the claim hierarchy.

---

## Next.js Interactive Graph Dashboard

To bring this persistent wiki to life for human adjusters, we built a highly interactive **Next.js Web UI** that renders the claim’s interlinked files as a visual, interactive knowledge graph (similar to Obsidian).

```
                      [ summary/claim_overview ]
                                /     \
                              /         \
                            /             \
            [ assessments/liability ]      [ assessments/damage_valuation ]
                        |                                 |
                        |                                 |
            [ evidence/statements/witness ]      [ evidence/official_reports/police ]
```

*   **Visual Ontological Connections**: Adjusters can instantly see how assessments connect to underlying evidence, making it easy to spot unverified claims or missing support links.
*   **State-Driven Styling**: Nodes are color-coded by their status. A contested node flashes amber, an active file is bright blue, and an un-ingested stub is represented as a hollow node—instantly calling the adjuster's attention to knowledge gaps.
*   **Secure IAP Access**: Fully containerized for Google Cloud Run, backed by strict application-default credentials, and secured behind **Identity-Aware Proxy (IAP)**, guaranteeing that sensitive customer data is locked down to authorized corporate logins.

---

## Conclusion

Traditional RAG is a powerful tool for static information retrieval, but for complex, stateful, and highly auditable business domains like insurance claims, it introduces unacceptable risks of temporal errors and hallucinations.

The **Active Knowledge Wiki Pattern** represents a fundamental paradigm shift. By orchestrating specialized ADK agents to maintain a persistent, interlinked markdown wiki inside Google Cloud Storage, organizations can build AI systems that are **chronologically aware, strictly factual, auditable to the source, and visually intuitive for human collaborators**.

Are you ready to move beyond the limitations of black-box vector search?

***

*For full implementation guides, deployment templates, and code repositories, refer to the project's [instructions.md](file:///Users/sgardezi/work/projects/knowldege-agent-claim-adk/instructions.md).*

---
TAG=agy
CONV=d007f6e4-c2a0-42a7-8351-65300d2d0ad6
