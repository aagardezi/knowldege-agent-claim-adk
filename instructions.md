# Deployment Instructions - LLM Wiki Agent

This document provides step-by-step instructions to deploy the LLM Wiki Agent to Google Cloud Vertex AI Agent Runtime.

## Configuration Checklist

Before running or deploying the project, ensure you have configured the following settings to match your GCP environment:

1. **Environment Files**:
   * Create a `.env` file in the **project root** and another `.env` file in the **`frontend/` directory**.
   * Define the following variables:
     ```env
     WIKI_BUCKET_NAME=your-custom-wiki-bucket
     LOGS_BUCKET_NAME=your-custom-logs-bucket
     ```
2. **GCP Resources**:
   * Identify your **Google Cloud Project ID** (referred to in commands as `[YOUR_PROJECT_ID]`).
   * Identify your **Google Cloud Project Number** (referred to in commands as `[YOUR_PROJECT_NUMBER]`).
3. **Documentation & Schemas**:
   * Update the GCS bucket configuration header inside [schema.md](file:///Users/sgardezi/work/projects/knowldege-agent-claim-adk/schema.md) to match your bucket name for consistent repository-level reference:
     ```markdown
     ## GCS Bucket Configuration
     The primary storage bucket for all claim wikis is `your-custom-wiki-bucket`.
     ```

## Prerequisites

 
 1.  **Google Cloud Project**: You need an active GCP project.
 2.  **Google Cloud SDK (gcloud)**: Installed and authenticated.
 3.  **Python & `uv`**: Ensure Python 3.11+ and `uv` are installed.
 4.  **`agents-cli`**: Installed via `uv tool install google-agents-cli`.
 5.  **Node.js & npm**: (Required for Web UI) Ensure Node.js (v18+) and npm are installed for local testing and building the frontend.


## Environment Variables

The agent and frontend require configuration using the following environment variables:

-   `WIKI_BUCKET_NAME`: **(Required)** The name of the GCS bucket used for storing the wiki content.
-   `LOGS_BUCKET_NAME`: The name of the GCS bucket used for storing telemetry logs and artifacts (optional).

For local development, you should set these in a `.env` file in the project root **and** in the `frontend/` directory:

```env
WIKI_BUCKET_NAME=your-custom-wiki-bucket
LOGS_BUCKET_NAME=your-custom-logs-bucket
```

## 1. Set Project and Enable Required APIs

First, ensure you have set the correct Google Cloud project:

```bash
gcloud config set project [YOUR_PROJECT_ID]
```

Then, enable the necessary Google Cloud APIs for the project. This command is important because the agent relies on Vertex AI (Agent Runtime) and Cloud Storage, and the UI relies on Artifact Registry, Cloud Build, and Cloud Run.

```bash
gcloud services enable \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com
```
- **`aiplatform.googleapis.com`**: Required for Vertex AI Agent Runtime, where the agent is deployed.
- **`storage.googleapis.com`**: Required for Google Cloud Storage, where the wiki content is stored.
- **`artifactregistry.googleapis.com`**: Required for storing the UI Docker image.
- **`run.googleapis.com`**: Required for deploying the UI to Cloud Run.
- **`cloudbuild.googleapis.com`**: Required for building the UI Docker image in the cloud.


## 2. Configure GCS Buckets

The agent relies on GCS buckets. Ensure they exist and you have access to them:

-   **Wiki Bucket**: `[YOUR_WIKI_BUCKET_NAME]` (Stores the wiki pages, schema, index, and log). You can override this by setting `WIKI_BUCKET_NAME`.

If they do not exist, create them:

```bash
gcloud storage buckets create gs://[YOUR_WIKI_BUCKET_NAME]
```
- **`gcloud storage buckets create`**: This command creates the specified buckets in your project. They are necessary to hold the agent's knowledge base and configuration.

### Flexible GCS-Driven Template Bootstrapping
Because the Claims Knowledge Agent isolates all data by Claim ID, files are stored under `<claim_id>/` subfolders inside the GCS bucket. 

To maximize operational flexibility and ensure you can adjust schemas or index templates dynamically without redeploying the reasoning engine backend, the agent uses a **GCS-first template architecture**:

1. **Claim Ingestion**: When a claim is first sent to the agent, the GCS module checks if `schema.md`, `index.md`, and `log.md` exist inside that specific claim's folder (e.g., `gs://[YOUR_WIKI_BUCKET_NAME]/CLM-2026-001/`).
2. **GCS-Root Source of Truth**: If a file is missing, the agent looks at the **root level of your GCS bucket** (`gs://[YOUR_WIKI_BUCKET_NAME]/[filename]`). If found, it copies it down into the claim's folder dynamically. This allows you to directly edit `gs://[YOUR_WIKI_BUCKET_NAME]/schema.md` in Cloud Storage and have all subsequent claims inherit your modifications instantly!
3. **Zero-Config Auto-Initialization**: If your GCS bucket is completely blank (i.e. no templates exist at the root level either), the agent fallback-initializes by loading the baseline templates packaged inside its code container, uploading them to the root of your GCS bucket (establishing your flexible GCS template registry), and then bootstrapping the claim.

No manual uploads or directory setups are needed to begin, yet you retain 100% runtime flexibility over your operational templates directly inside GCS!


## 3. IAM Permissions



### User Permissions (Deployer)

To successfully package and deploy the agent using `agents-cli`, your developer or CI/CD service account needs the following roles on your GCP project:
-   **Vertex AI Administrator** (`roles/aiplatform.admin`) — Required to create and manage the Reasoning Engine resources.
-   **Storage Admin** (`roles/storage.admin`) — Required to verify, create GCS buckets, and upload containerized source archives.
-   **Service Account User** (`roles/iam.serviceAccountUser`) — **(Critical)** Required to allow your deployer user to bind and assign service accounts to the deployed reasoning engine.

### Agent Service Account Permissions (GCS Access)

When you deploy the agent, Vertex AI automatically spins up a dedicated Service Agent to run the containerized agent code. To enable the agent to read, write, and maintain the claim-scoped wiki folders inside your GCS bucket:

1. Find the service account assigned to your deployed reasoning engine. It adheres to this standard format:
   `service-<GCP_PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com`
   *(You can find this email in your terminal output immediately after a successful `agents-cli deploy` run).*

2. Grant this Service Account the **Storage Object Admin** role on your GCS bucket:
   ```bash
   gcloud storage buckets add-iam-policy-binding gs://[YOUR_WIKI_BUCKET_NAME] \
       --member="serviceAccount:service-[YOUR_PROJECT_NUMBER]@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
       --role="roles/storage.objectAdmin"
   ```
   - **`gcloud storage buckets add-iam-policy-binding`**: This command gives the agent's runtime environment complete read, write, and deletion rights inside your claims bucket. Without this, all ingestion and wiki maintenance actions will throw authentication exceptions.

### Client / Frontend Invocation Permissions

If you are running the Next.js Web UI (`claims-knowledge-ui`) or calling the reasoning engine via custom backend APIs:
1. The frontend client (running under your user credentials locally, or under a dedicated Cloud Run service account in dev/prod) must have permission to invoke the agent.
2. Grant your client credentials or frontend service account the **Vertex AI User** (`roles/aiplatform.user`) role on your GCP project:
   ```bash
   gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
       --member="serviceAccount:[YOUR_FRONTEND_SERVICE_ACCOUNT]" \
       --role="roles/aiplatform.user"
   ```
   - **`roles/aiplatform.user`**: Grants the client permission to invoke the Reasoning Engine's `query` / `predict` endpoints. Without this, the UI will crash with `403 Forbidden` when attempting to load claim logs or indexes.


## 4. Deployment Steps

Navigate to the project root directory:

```bash
cd <your-project-root-directory>
```

Deploy the agent using `agents-cli`. Make sure to specify your GCP project ID and inject your custom GCS bucket name using the `--update-env-vars` parameter:

```bash
agents-cli deploy --project [YOUR_PROJECT_ID] --no-confirm-project --update-env-vars WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME]
```

-   **`--project [YOUR_PROJECT_ID]`**: Specifies the GCP project to deploy the agent reasoning engine to.
-   **`--no-confirm-project`**: Skips the interactive project confirmation step.
-   **`--update-env-vars WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME]`**: **(Critical)** Feeds your specific GCS wiki bucket name into the reasoning engine's runtime environment. Without this parameter, the reasoning engine will fall back to a default value and throw invalid bucket name errors.

This command will:
-   Introspect your application.
-   Package the code.
-   Deploy it to Vertex AI Agent Runtime.

## 5. Verification

Once deployed, you will receive a Playground URL in the output. You can use it to test the agent in the Cloud Console.

Alternatively, you can run and test the agent locally before deploying to Cloud:

### Option A: ADK Web Playground (Recommended for Interactive Browser UI)
The ADK framework features an interactive browser chat interface to let you chat with the agent, view step-by-step tool calls, and analyze reasoning outputs:
```bash
# Run the local ADK web playground in your browser
WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME] uv run adk web
```
- **Open Playground**: Navigate to [http://localhost:8000](http://localhost:8000) (or the port indicated in the terminal) to interact.

### Option B: agents-cli Terminal Playground (Command Line CLI)
If you want a lightweight, interactive chat playground directly inside your active terminal window:
```bash
# Start the terminal chat session
WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME] agents-cli playground
```
- **Usage**: Start typing messages directly to test your prompt logic and GCS dynamic bootstrapping fallbacks in real-time.

## 6. Running the Wiki Web UI Locally

You can run the frontend locally to test the UI and the graph visualization.

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18+ recommended).
2.  **Application Default Credentials**: The frontend needs to access GCS. Ensure you have set up Application Default Credentials:
    ```bash
    gcloud auth application-default login
    ```

### Steps

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set the `WIKI_BUCKET_NAME` environment variable and start the development server:
    ```bash
    # On macOS/Linux
    WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME] npm run dev
    
    # On Windows (PowerShell)
    $env:WIKI_BUCKET_NAME="[YOUR_WIKI_BUCKET_NAME]"; npm run dev
    ```
    Replace `[YOUR_WIKI_BUCKET_NAME]` with your specific bucket name (e.g., `my-llm-wiki-bucket`).

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> If port 3000 is already in use, Next.js might fail to start or try to use another port. You can specify a port using `npm run dev -- -p [PORT_NUMBER]`.


## 7. Deploying the Wiki Web UI to Cloud Run with IAP

The UI is located in the `frontend` directory and is built as a Next.js application. These instructions cover deploying it with direct Identity-Aware Proxy (IAP) integration.

### Prerequisites for UI Deployment

1.  **Artifact Registry**: You need a repository to store the Docker image.
2.  **Cloud Run**: Enabled in your project.
3.  **IAP**: Enabled in your project.

### Step-by-Step Deployment

1.  **Enable Required APIs**:
    ```bash
    gcloud services enable iap.googleapis.com run.googleapis.com
    ```

2.  **Create Artifact Registry Repository** (if you don't have one):
    ```bash
    gcloud artifacts repositories create agentwiki-repo \
        --repository-format=docker \
        --location=us-central1 \
        --description="Docker repository for AgentWiki"
    ```

3.  **Build and Push the Docker Image**:
    Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
    Build the image using Cloud Build:
    ```bash
    gcloud builds submit --tag us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/agentwiki-repo/claims-wiki-ui:latest .
    ```
    *(Uses your active project ID: `[YOUR_PROJECT_ID]`)*

4.  **Deploy to Cloud Run with IAP**:
    ```bash
    gcloud run deploy claims-wiki-ui \
        --image us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/agentwiki-repo/claims-wiki-ui:latest \
        --platform managed \
        --region us-central1 \
        --no-allow-unauthenticated \
        --iap \
        --set-env-vars WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME]
    ```
    *(Automatically configures your GCS wiki bucket `[YOUR_WIKI_BUCKET_NAME]` inside the Next.js container)*
    *   `--no-allow-unauthenticated`: Restricts public access.
    *   `--iap`: Enables direct IAP integration.

5.  **Grant Invoker Permission to IAP Service Agent**:
    IAP needs permission to invoke the Cloud Run service.
    ```bash
    gcloud run services add-iam-policy-binding claims-wiki-ui \
        --region=us-central1 \
        --member=serviceAccount:service-[YOUR_PROJECT_NUMBER]@gcp-sa-iap.iam.gserviceaccount.com \
        --role=roles/run.invoker
    ```
    *(Uses your active project number: `[YOUR_PROJECT_NUMBER]`)*

6.  **Grant Access to Users**:
    Grant the "IAP-secured Web App User" role to the users who should have access.
    ```bash
    gcloud iap web add-iam-policy-binding \
        --member=user:[USER_EMAIL] \
        --role=roles/iap.httpsResourceAccessor \
        --region=us-central1 \
        --resource-type=cloud-run \
        --service=claims-wiki-ui
    ```
    Replace `[USER_EMAIL]` with the email of the user (e.g., `user@example.com`).

### IAM Permissions for Cloud Run to access GCS

The Cloud Run service needs permission to read from the GCS wiki bucket.

1.  Grant the Cloud Run service account **Storage Object Viewer** (`roles/storage.objectViewer`) on the wiki bucket. By default, Cloud Run uses the default compute service account:
    ```bash
    gcloud storage buckets add-iam-policy-binding gs://[YOUR_WIKI_BUCKET_NAME] \
        --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
        --role="roles/storage.objectViewer"
    ```



## 8. Enabling Telemetry & Observability

The LLM Wiki Agent project comes integrated with standard **OpenTelemetry (OTel)** instrumentation and completion hooks configured to export GenAI telemetry traces to Google Cloud Storage (GCS). 

This allows you to monitor model performance, latency, token consumption, and execution success rates.

### Local Telemetry Setup

To enable tracing during local development (using the `playground`):

1.  **Create a Telemetry GCS Bucket**:
    Create a separate, secure GCS bucket dedicated to telemetry logs:
    ```bash
    gcloud storage buckets create gs://your-telemetry-logs-bucket --location=us-central1
    ```

2.  **Configure Local Environment Variables**:
    Open the `.env` file in the project root and add the following parameters:
    ```env
    # The GCS bucket to upload JSONL trace entries
    LOGS_BUCKET_NAME=your-telemetry-logs-bucket
    
    # Set to 'true' to activate the telemetry completion hooks
    OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
    ```

3.  **Run the Agent**:
    Start the agent playground. You will see the following confirmation log in the terminal startup:
    `INFO:root:Prompt-response logging enabled - mode: NO_CONTENT (metadata only, no prompts/responses)`

### Production Setup (Cloud Run / Agent Engine)

To activate GenAI telemetry traces in the deployed production environment, supply the telemetry environment variables during service deployment:

```bash
gcloud run deploy claims-wiki-ui \
    --image us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/agentwiki-repo/claims-wiki-ui:latest \
    --platform managed \
    --region us-central1 \
    --no-allow-unauthenticated \
    --iap \
    --set-env-vars WIKI_BUCKET_NAME=[YOUR_WIKI_BUCKET_NAME],LOGS_BUCKET_NAME=[YOUR_TELEMETRY_LOGS_BUCKET],OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
```

#### Required IAM Permissions
The Cloud Run runtime service account needs write permissions to upload telemetry logs.
Grant the service account **Storage Object Creator** (`roles/storage.objectCreator`) on the logs bucket:
```bash
gcloud storage buckets add-iam-policy-binding gs://[YOUR_TELEMETRY_LOGS_BUCKET] \
    --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
    --role="roles/storage.objectCreator"
```

---

### 🔒 Security & Data Privacy Note

> [!IMPORTANT]
> **Enterprise PII-Safe Logs**: To prevent leakage of customer queries or proprietary backend responses in operational logs, the telemetry subsystem actively overrides the OpenTelemetry interception standard to **`NO_CONTENT`**. 
> 
> *   **Captured Metadata**: Trace logs **only** record performance and utilization metrics (token counts, execution latency, API return codes, and model identifiers).
> *   **Protected Content**: The actual textual content of the prompts and LLM replies are **strictly suppressed** and are **never** written or saved to the GCS telemetry bucket.


