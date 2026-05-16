## 🧪 Case Study: Active Wiki Agent vs. Passive RAG (Claim CLM-2026-001)

To prove the real-world superiority of the **Active Knowledge Agent Wiki Pattern** over **Traditional RAG (Retrieval-Augmented Generation)**, we ran a head-to-head case study. 

We ingested a complex, intentionally contaminated test claim package for claim **CLM-2026-001** into both systems. The document set contains 30 files (PDFs) detailing a vehicle collision, but with severe logical conflicts, mathematical errors, and anomalous home restoration data mixed in.

We asked both systems the exact same question:
> *"Can you summarise the claim: CLM-2026-001?"*

---

### 🥊 The Responses Side-by-Side

| Feature / Dimension | Passive RAG (e.g., Vertex AI Search) | Active Knowledge Agent Wiki |
| :--- | :--- | :--- |
| **Synthesis Quality** | Passive accumulation of text. Merges conflicting facts into a single, flat description without questioning relationships. | Active semantic synthesis. Isolates claims, builds an organized ontology, and maintains a verified claim timeline. |
| **Data Inconsistency Handling** | **Blind Acceptance.** Accepts that a rear-end auto collision caused mold remediation and stripped roof shingles. | **Contradiction Detection.** Detects and flags conflicting facts across multiple files as `contested` for human audit. |
| **Temporal Awareness** | **Time-Blind.** Fails to notice if a repair estimate is dated years before or after the actual accident. | **Timeline Verification.** Compares dates across FNOL, estimates, and memos to identify chronological anomalies. |
| **Mathematical Auditing** | **None.** Accepts reported totals without validating if the line items sum up correctly. | **Automatic Math Validation.** Audits final payments against estimates and raises alerts on discrepancy. |
| **Transparency & Editability** | **None.** Binary vector database that humans cannot read, audit, or easily edit. | **Plain Markdown in GCS.** Fully readable and editable by human claims adjusters directly via a Web UI. |

---

### 📄 1. Passive RAG (Vertex AI Search) Response
> "This claim, identified as CLM-2026-001, involves Eleanor Vance... auto rear-end collision... police report PR-2026-88341... She stated that the total actual cash value of the property at the time of loss was $35,000.00, and the total cost of restoration was $8,500.00... The claim was closed and resolved on February 28, 2026. The total property damage settled was $7,500.00, total bodily injury settled was $500.00, and total ancillary expenses paid were $490.00."

> [!WARNING]
> **Passive RAG Failure Mode**: The RAG response completely missed every single contradiction in the claim. It accepted that a rear-end auto collision resulted in residential "property restoration" and mold remediation, ignored a temporal shift, and accepted a mathematical error without alert.

---

### 🧠 2. Active Knowledge Agent Wiki Response
> "Claim CLM-2026-001 is a closed/resolved claim involving a vehicle collision and overlapping property damage that occurred on January 12, 2026.
> 
> **General Information**
> - **Claimant:** Eleanor Vance
> - **Adjuster:** Mark Thompson
> - **Date of Loss:** 2026-01-12
> - **Status:** Closed / Resolved (as of 2026-02-28)
> - **Liability:** 100% fault attributed to the third party, James Miller, who was driving a 2018 Ford Explorer.
> 
> **Incident & Damages**
> The incident occurred at approximately 14:15 on Grand Avenue.
> - **Vehicle Damage:** The insured's 2022 Honda Civic sustained front and rear bumper damage and required a frame alignment check. Repairs were completed on 2026-02-15.
> - **Property Damage:** Reported damages include stripped roof shingles, mold remediation, a collapsed interior ceiling, and broken French glass doors.
> - **Bodily Injury:** Eleanor Vance sustained a left radius fracture, mild whiplash (neck soreness), and smoke inhalation. She was prescribed four weeks of physical therapy.
> 
> **Financial Summary**
> - **Total Settlement:** Reported as $8,500.00 (finalized on 2026-02-22).
> - **Property:** $7,500.00
> - **Medical:** $500.00
> - **Rental:** $490.00 (2025 Hyundai Elantra used from 2026-01-13 to 2026-02-15)
> - **Deductible:** $500.00 (paid by Eleanor Vance)
> - **Subrogation:** Active; a recovery demand for $8,500.00 was sent to James Miller's carrier.
> 
> **Key Discrepancies & Contested Details (Confidence: 0.8)**
> Several significant inconsistencies have been identified in the claim records:
> - **Timeline Discrepancy:** The Elite Auto Body Estimate is dated 2024-05-22, which predates the actual accident by nearly two years.
> - **Mathematical Error:** The reported total settlement ($8,500.00) does not match the sum of its parts ($7,500 + $500 + $490 = $8,490.00).
> - **Unexplained Damages:** "Pry marks" were noted on the French doors, which do not align with the reported collision or falling tree incident.
> - **Premature Subrogation:** The Subrogation Demand Letter was issued on the same day as the loss (2026-01-12), before the liability assessment was finalized on 2026-02-05.
> - **Unaddressed Repairs:** Damage to the trunk lid and exhaust system was noted but remains unaddressed in the final financial settlement.
> 
> Summary based on `summary/claim_overview.md`, `summary/policy_details.md`, and `settlement/final_settlement.md` as of 2026-05-16"

> [!TIP]
> **Active Agent Success Mode**: The Active Agent's double-verifier pipeline (Synthesizer + Reviewer) ran cross-file logical validation. By identifying these anomalies, it automatically marked the claim files as `contested` and rendered warning banners in the Web UI, protecting the insurer from potential fraud or error.

---

### 🔍 Deep-Dive: The 5 Critical Anomalies Unmasked by the Active Agent

How did the Active Agent perform this deep reasoning? It used its multi-agent collaboration to cross-reference and audit the following:

1. **The Multi-Claim Data Contamination (Logical Anomaly)**
   * *The Data:* The Police Report (`03_police_incident_report.pdf`) and Witness Statements contain slash-separated descriptions: *"Insured vehicle / property was severely damaged... intersection / wind event knocked tree..."*
   * *Passive RAG:* Blindly stated that the rear-end collision caused damage to the vehicle/home.
   * *Active Agent:* Recognized that an auto body shop estimate (`17_body_shop_repair_estimate_elite.pdf`) including "roof shingles and mold remediation labor ($4,500)" is highly irregular and flagged the overlap.
2. **The Chronological Time Warp (Temporal Anomaly)**
   * *The Data:* The Elite Auto Body Estimate contains metadata/header dates from 2024-05-22, whereas the accident occurred on 2026-01-12.
   * *Passive RAG:* Completely missed the date difference.
   * *Active Agent:* Scanned the timeline, flagged the estimate as predating the accident by nearly two years, and marked the file status as `CONTESTED`.
3. **The $10 Payment Discrepancy (Mathematical Anomaly)**
   * *The Data:* The Settlement Offer Letter (`28_settlement_offer_letter.pdf`) specifies a total offer of **$8,500.00**, but lists the parts as: Shop: $7,500; Medical: $500; Rental: $490.
   * *Passive RAG:* Simply listed both conflicting numbers in separate sentences without noticing.
   * *Active Agent:* Performed arithmetic validation: $7,500 + $500 + $490 = $8,490.00. It flagged the $10 math error as a contested discrepancy.
4. **The Premature Subrogation demand (Operational Anomaly)**
   * *The Data:* The Subrogation Demand Letter (`26_subrogation_demand_letter.pdf`) was sent on the exact day of the accident (2026-01-12). However, the Adjuster's official Liability assessment memo (`25_internal_liability_assessment_memo.pdf`) was not finalized until 2026-02-05.
   * *Passive RAG:* Reported both dates as flat events.
   * *Active Agent:* Identified the operational risk of initiating subrogation recovery before formal liability assessment was complete.
5. **The Forgotten Exhaust System (Scope Anomaly)**
   * *The Data:* The First Notice of Loss (FNOL) explicitly stated the impact caused substantial damage to the *"rear bumper, trunk lid, and exhaust system."*
   * *Passive RAG:* Omitted this detail or listed it without cross-checking.
   * *Active Agent:* Compared the FNOL to the final Elite repair invoice, noting that while the bumper was replaced, the trunk lid and exhaust system repairs were completely missing from the final settlement, leaving outstanding damage.

---

### 🏛️ Architectural Reason: Why Active Wiki Wins

Traditional RAG is stateless and statelessness breeds context blindness. Because standard RAG only retrieves small chunks of text that match a vector search, it lacks a **global conceptual map** of the claim. It cannot compare what is written on page 1 of document A with page 5 of document B.

The **Active Knowledge Agent Wiki Pattern** wins because:
1. **It keeps state:** It actively summarizes and structures files into an interlinked GCS Wiki.
2. **It validates claims:** Its independent **Reviewer Agent** acts as a constant audit loop, checking new text against existing pages.
3. **It leverages an ontology:** It creates explicit relationships like `[elite-collision-estimate] -[contradicts]-> [fnol-report]` to build a high-precision, human-auditable knowledge graph.
