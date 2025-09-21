# Project: AI Startup Evaluator

## Project Overview

Build an AI-powered analyst platform that evaluates startups by synthesizing founder materials and public data to generate concise, actionable investment insights.

## Application Flow

1.  **Data Ingestion:**
    *   Founder materials (pitch decks, etc.) are uploaded through the **Firebase Web App**.
    *   The `process-document` Cloud Function is triggered to process the uploaded documents, extract the text, and store it in **Firestore**.
    *   Public data from sources like GDELT and EDGAR is ingested by scheduled **Cloud Run Jobs** and stored in **BigQuery**.

2.  **Vectorization:**
    *   The `vectorize-deal-note` Cloud Function is triggered by new documents in Firestore.
    *   It generates vector embeddings of the document text using the Gemini embedding model.
    *   The embeddings are stored in the **AlloyDB** database.

3.  **RAG Query and Analysis:**
    *   The user submits a query through the **Firebase Web App**.
    *   The query is sent to the `rag-query-service`.
    *   The `rag-query-service`:
        *   Retrieves relevant documents from **AlloyDB** using vector search.
        *   Fetches additional data from **Bigtable** and **BigQuery**.
        *   Calls the **Gemini model** with the retrieved context and a toolset from the **MCP Toolbox**.
        *   If the model needs more information, it calls the `request_missing_data` tool.

4.  **Conversational Data Collection:**
    *   The `request_missing_data` tool call is handled by the `rag-query-service`, which calls the `context-management-service`.
    *   The `context-management-service` (the ADK agent) interacts with the user via chat, forms, or voice mail to collect the missing data.
    *   The collected data is then sent back to the `rag-query-service` to continue the analysis.

5.  **Dashboard and Insights:**
    *   The final analysis and insights are displayed on the **Insight Dashboard** in the **Firebase Web App**.
    *   The "Data Room" tab tracks the status of pending data requests.

## Project Plan

### Phase 1: Infrastructure and Data Pipeline Refactoring (Completed)

- [x] Set up MCP Toolbox service.
- [x] Set up AlloyDB with `pgvector`.
- [x] Set up Bigtable.
- [x] Set up BigQuery datasets and tables.

### Phase 2: Advanced RAG and Gemini Integration (Completed)

- [x] Update `vectorize-deal-note` function to use AlloyDB.
- [x] Create `rag-query-service` with RAG pipeline and MCP Toolbox integration.

### Phase 3: Conversational Data Collection (In Progress)

- **Completed:**
    - [x] Set up ADK environment.
    - [x] Create and define the `context-management-service` agent.
- **Pending:**
    - [ ] Deploy the `context-management-service` agent to Cloud Run.
    - [ ] Implement the logic for the agent to handle data collection via chat, forms, and voice mail.

### Phase 4: UI/Dashboard (In Progress)

- **Completed:**
    - [x] Create `QueryInterface.js` component.
    - [x] Add `QueryInterface` component to `InsightDashboard.js`.
    - [x] Implement the "Data Room" tab for tracking data requests.
- **Pending:**
    - [ ] Refine the UI to de-emphasize file upload and focus on conversational interaction.
    - [ ] Implement a more robust project management feature (future iteration).

## Remaining Plan

### Phase 3: Conversational Data Collection

- **Deploy the `context-management-service`:**
    - Run `adk deploy cloud_run context-agent-app` from the `my-agents` directory.
- **Implement the agent's logic:**
    - Add the logic to the `agent.py` file to handle the `request_missing_data` tool call and interact with the user.

### Phase 4: UI/Dashboard

- **Refine the UI:**
    - De-emphasize the file upload.
    - Focus on the conversational interaction.

## Placeholders and Configuration Details

### Secrets (in Google Secret Manager)

- `alloydb-password`: The password for the AlloyDB `postgres` user.
- `gemini-api-key`: Your API key for the Gemini model.

### Environment Variables (in `terraform/variables.tf`)

- `project_id`
- `region`
- `bucket_name`
- `service_account_email`
- `env`

### Environment Variables (for Cloud Run services)

- **`vectorize-deal-note` function:**
    - `ALLOYDB_INSTANCE_CONNECTION_NAME`
    - `ALLOYDB_DB`
    - `ALLOYDB_USER`
    - `ALLOYDB_PASSWORD` (from Secret Manager)
- **`rag-query-service`:**
    - `GEMINI_API_KEY` (from Secret Manager)
    - `ALLOYDB_INSTANCE_CONNECTION_NAME`
    - `ALLOYDB_DB`
    - `ALLOYDB_USER`
    - `ALLOYDB_PASSWORD` (from Secret Manager)
    - `BIGTABLE_INSTANCE_ID`
    - `BIGTABLE_TABLE_ID`
    - `MCP_TOOLBOX_URL`
    - `CONTEXT_MANAGEMENT_SERVICE_URL`

## How to Run

### Deploy the Infrastructure

1.  Navigate to the `terraform` directory.
2.  Run `terraform init`.
3.  Run `terraform apply`.

### Run the Frontend Application

1.  Navigate to the root of the project.
2.  Run `npm install`.
3.  Run `npm start`.