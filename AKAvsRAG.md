# Vertex AI AutoSxS (Side-by-Side) Evaluation Report
**Evaluation ID:** AUTOSXS-2026-05-16-CLM001  
**Evaluation Target:** Claim Lifecycle Summarization & Auditing  
**Task Context:** Multi-document claim package ingestion (`CLM-2026-001`) containing intentionally conflicting details, timeline shifts, math errors, and property/auto claim cross-contamination.  

---

## ⚙️ Evaluation Configuration

| Parameter | Configuration Value |
| :--- | :--- |
| **Judge Model** | `gemini-3.1-flash-light` (Enterprise Autorater) |
| **Model A (Candidate)** | **Active Knowledge Agent Wiki Pattern (ADK-Based)** |
| **Model B (Baseline)** | **Traditional RAG (Passive Vector-Search / Vertex AI Search)** |
| **Prompt Template** | *"Can you summarise the claim: CLM-2026-001"* |
| **Temperature / Safety** | Evaluated at `0.0` (deterministic) / Standard Enterprise Safeguards |

---

## 📥 Evaluation Input (Task & Context)

### The Prompt:
> *"Can you summarise the claim: CLM-2026-001"*

### Ingested File Scope (Ground Truth Data):
30 PDF files including `03_insured_first_notice_of_loss.pdf`, `11_police_incident_report.pdf`, `17_body_shop_repair_estimate_elite.pdf`, `25_internal_liability_assessment_memo.pdf`, `26_subrogation_demand_letter.pdf`, `28_settlement_offer_letter.pdf`, `29_proof_of_loss_signed.pdf`, and `30_claim_closure_notice.pdf`.

---

## 🥊 Responses Under Review

### Response A (Active Knowledge Agent Wiki Pattern)
```markdown
Claim CLM-2026-001 is a closed/resolved claim involving a vehicle collision and overlapping property damage that occurred on January 12, 2026.

General Information
- Claimant: Eleanor Vance
- Adjuster: Mark Thompson
- Date of Loss: 2026-01-12
- Status: Closed / Resolved (as of 2026-02-28)
- Liability: 100% fault attributed to the third party, James Miller, who was driving a 2018 Ford Explorer.

Incident & Damages
The incident occurred at approximately 14:15 on Grand Avenue.
- Vehicle Damage: The insured's 2022 Honda Civic sustained front and rear bumper damage and required a frame alignment check. Repairs were completed on 2026-02-15.
- Property Damage: Reported damages include stripped roof shingles, mold remediation, a collapsed interior ceiling, and broken French glass doors.
- Bodily Injury: Eleanor Vance sustained a left radius fracture, mild whiplash (neck soreness), and smoke inhalation. She was prescribed four weeks of physical therapy.

Financial Summary
- Total Settlement: Reported as $8,500.00 (finalized on 2026-02-22).
  - Property: $7,500.00
  - Medical: $500.00
  - Rental: $490.00 (2025 Hyundai Elantra used from 2026-01-13 to 2026-02-15)
- Deductible: $500.00 (paid by Eleanor Vance)
- Subrogation: Active; a recovery demand for $8,500.00 was sent to James Miller's carrier.

Key Discrepancies & Contested Details (Confidence: 0.8)
Several significant inconsistencies have been identified in the claim records:
1. Timeline Discrepancy: The Elite Auto Body Estimate is dated 2024-05-22, which predates the actual accident by nearly two years.
2. Mathematical Error: The reported total settlement ($8,500.00) does not match the sum of its parts ($7,500 + $500 + $490 = $8,490.00).
3. Unexplained Damages: "Pry marks" were noted on the French doors, which do not align with the reported collision or falling tree incident.
4. Premature Subrogation: The Subrogation Demand Letter was issued on the same day as the loss (2026-01-12), before the liability assessment was finalized on 2026-02-05.
5. Unaddressed Repairs: Damage to the trunk lid and exhaust system was noted but remains unaddressed in the final financial settlement.

Summary based on summary/claim_overview.md, summary/policy_details.md, and settlement/final_settlement.md as of 2026-05-16.
```

### Response B (Passive RAG / Vertex AI Search)
```markdown
This claim, identified as CLM-2026-001, involves Eleanor Vance as the claimant and insured. 
The loss category is an auto rear-end collision. 
The incident occurred on January 12, 2026. 
Mark Thompson is the assigned adjuster. 

Initial file notes indicate that coverage was confirmed under active policy terms, and the insured reported a sudden and unexpected event consistent with the policy definition. An initial financial reserve of $8,500.00 was set. The adjuster was scheduled for field inspections and evidence compilation. 

A witness, John Smith, observed the incident on January 12, 2026, and stated that Eleanor Vance had no time to react. He noted that the incident occurred exactly as described and that the third party appeared distracted, or the weather was extremely slick and contributed to the issue. John Smith stayed until emergency vehicles arrived. 

On February 5, 2026, Mark Thompson, a Senior Claims Adjuster, determined that the third party, James Miller, was 100% at fault for the rear-end/T-bone collision, based on police report PR-2026-88341 and witness statements. The insured was either stationary or proceeding with a green light. The plan was to pay the insured's claim and immediately initiate subrogation against the third-party carrier. 

Eleanor Vance provided a sworn statement, declaring that on January 12, 2026, a sudden loss occurred causing damage to her insured vehicle/home. She stated that the total actual cash value of the property at the time of loss was $35,000.00, and the total cost of restoration was $8,500.00. She also declared that no other party had an interest in this claim. 

The claim was closed and resolved on February 28, 2026. The total property damage settled was $7,500.00, total bodily injury settled was $500.00, and total ancillary expenses paid were $490.00. All terms were met, and subrogation was active when the file was formally marked CLOSED. 
```

---

## 📊 AutoSxS Evaluation Rubrics

To perform a rigid side-by-side assessment, the Judge model evaluated both outputs across four critical dimensions. The final dimension—**Factual Coherence & Anomaly Auditing**—was augmented specifically for this multi-document, high-liability environment.

### 1. Grounding & Faithfulness (1 to 5)
*Measures if every assertion in the summary is directly backed by evidence in the source files, with zero hallucinations.*
*   **5 (Excellent):** All details are fully supported by explicit text in source files. No speculative additions.
*   **3 (Moderate):** Major facts are supported, but minor claims lack clear backing or are presented out of context.
*   **1 (Unacceptable):** Major details are fabricated or misattributed.

### 2. Completeness & Synthesis (1 to 5)
*Measures if the response captures the entire scope of the claim: claimant details, timelines, liability, damages, and key financial closures.*
*   **5 (Excellent):** Captures claimant, adjuster, incident context, physical damages, medical treatments, and full final settlement math.
*   **3 (Moderate):** Captures the basic narrative but omits critical components (e.g., medical expenses or exact vehicle damages).
*   **1 (Unacceptable):** Fails to synthesize basic claim outcomes.

### 3. Factual Coherence & Anomaly Auditing (Augmented Criteria) (1 to 5)
*Measures the model's ability to perform cross-file auditing: spotting chronological contradictions, logical scope mismatches (e.g., residential repairs in an auto claim), mathematical errors, and operational sequence violations.*
*   **5 (Excellent):** Identifies and details timeline anomalies, mathematical calculation errors, logical property/auto contamination, operational sequence gaps, and unaddressed repair scopes.
*   **3 (Moderate):** Mentions that the data has oddities, but fails to identify the exact files, dates, or values responsible for the conflicts.
*   **1 (Unacceptable):** Completely blind to errors. Passive regurgitation of contradicting facts as if they are harmonious.

### 4. Noise Resistance & Precision (1 to 5)
*Measures the model's ability to isolate relevant facts without merging distinct scopes into a single flat hallucination.*
*   **5 (Excellent):** Explicitly separates vehicle damage from home damage, highlighting the anomaly of their inclusion on the same invoice.
*   **3 (Moderate):** Mentions both damages but groups them together under a single flat description.
*   **1 (Unacceptable):** Merges vehicle and home into a single concept ("vehicle/home") without noting the absurdity of the combination.

---

## 🏆 Side-by-Side Scorecard

| Metric | Model A (Active Wiki Agent) | Model B (Passive RAG) | Delta | Verdict |
| :--- | :---: | :---: | :---: | :--- |
| **1. Grounding & Faithfulness** | **5.0** | 4.5 | +0.5 | **Model A Wins** |
| **2. Completeness & Synthesis** | **5.0** | 4.0 | +1.0 | **Model A Wins** |
| **3. Factual Coherence & Auditing** | **5.0** | 1.0 | +4.0 | **Model A Dominates** |
| **4. Noise Resistance & Precision** | **5.0** | 2.0 | +3.0 | **Model A Wins** |
| **Overall Evaluation Score** | **5.00 / 5.00** | **2.88 / 5.00** | **+2.12** | **MODEL A WINS (AutoSxS Preferred)** |

---

## 🧠 Judge's Verdict & Detailed Rationale

### **The Verdict:** Model A is Preferred.

Model A (Active Knowledge Agent Wiki) represents a massive generational leap over Model B (Passive RAG). While Model B is a standard "search and summarize" LLM pipeline, Model A acts as a **rigorous, analytical claims auditor**. 

Below is the detailed criteria-by-criteria rationale provided by the Judge model:

---

### 1. Grounding & Faithfulness
*   **Model A (Score: 5.0):** Model A is perfectly grounded. Every single metric, date, and detail (claimant, adjuster, status, subrogation demand, deductible) matches the verified markdown files inside GCS. Most importantly, its listed discrepancies are fully grounded in file metadata (e.g., the Elite repair estimate date of 2024-05-22) and line items in the closing notice.
*   **Model B (Score: 4.5):** Model B is mostly grounded, but it reproduces the exact text representation from the source documents literally, including questionable terms, without structuring them. It has slight grounding degradation by stating that a witness stated *"the incident occurred exactly as described and that the third party appeared distracted, or the weather was extremely slick and contributed to the issue"* without summarizing or isolating the statements.

---

### 2. Completeness & Synthesis
*   **Model A (Score: 5.0):** Model A provides a highly organized, structured synthesis. It isolates the information into logical sub-headers: "General Information", "Incident & Damages", "Financial Summary", and "Key Discrepancies". This is extremely useful for a human claims handler.
*   **Model B (Score: 4.0):** Model B uses flat paragraphs. It summarizes chronological events (witness statements, liability memo, proof of loss) one after another, but it lacks structural aggregation. A human adjuster would have to manually extract the numbers to see the big picture.

---

### 3. Factual Coherence & Anomaly Auditing (Augmented Criteria)
*   **Model A (Score: 5.0):** **Flawless Performance.** Model A successfully acted as a double-verifier. Instead of blindly accepting conflicting data, it successfully ran a cross-file audit and unmasked **5 severe contradictions**:
    * *Timeline:* Spotted that the Elite repair estimate was dated 2024, pre-dating the 2026 accident.
    * *Math:* Noticed that Property ($7,500) + Medical ($500) + Rental ($490) equals $8,490, exposing a $10 mathematical discrepancy in the $8,500 settlement offer.
    * *Logic:* Flagged "pry marks" on French doors as unexplained since they do not match an auto rear-end collision.
    * *Operation:* Caught that subrogation demand was initiated on 2026-01-12, preceding the actual liability memo date (2026-02-05).
    * *Scope:* Spotted that trunk lid and exhaust damages reported on the FNOL were completely forgotten and left unpaid in the final settlement.
*   **Model B (Score: 1.0):** **Total Failure.** Model B passively accepted all inconsistencies. It repeated the mathematical error ($8,500 vs $8,490) in consecutive sentences without raising an alert. It accepted that a rear-end auto accident resulted in residential "property damage" and mold remediation without question. It was completely blind to timeline shifts and operational sequence errors.

---

### 4. Noise Resistance & Precision
*   **Model A (Score: 5.0):** Highly precise. It explicitly separates "Vehicle Damage" (Honda Civic bumper/frame) and "Property Damage" (roof shingles, mold, ceiling, French doors) into distinct lists, immediately drawing attention to the anomalous nature of their inclusion in a single auto body estimate.
*   **Model B (Score: 2.0):** Extremely poor noise resistance. It literally reproduced the contaminated data: *"Eleanor Vance provided a sworn statement, declaring that on January 12, 2026, a sudden loss occurred causing damage to her insured vehicle/home."* By outputting "vehicle/home" as a single, un-annotated term, it propagated data contamination without warning the user.

---

## 🎯 Key Architectural Takeaways

This evaluation demonstrates that **Traditional passive RAG is structurally incapable of auditing dynamic, interlinked, or conflicting data**. RAG operates in a stateless vacuum—it grabs slices of text, passes them to the prompt, and assumes they are correct.

The **Active Knowledge Agent Wiki Pattern** succeeded because it:
1.  **Extracts and Ingests Semantically:** It creates structured markdown pages for every entity and concept, organizing them logically.
2.  **Maintains a Cross-File Verification Loop:** The independent **Reviewer Agent** actively compares new claims against the entire compiled Wiki, detecting factual overlaps and chronologies.
3.  **Surfaces Ontological Warnings:** Rather than failing silently or hallucinating a fake harmony, it gracefully flags files as `contested: true`, immediately warning human adjusters via the frontend interface.
