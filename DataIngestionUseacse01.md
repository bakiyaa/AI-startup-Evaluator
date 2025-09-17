# Data Ingestion Use Case 01: Centralized RAG Pipeline

This document outlines a centralized, event-driven architecture for a "Media and Content Processing" (mcp) pipeline. The primary goal is to ingest various file types, process them using AI, store them for Retrieval-Augmented Generation (RAG), and reliably notify downstream services.

### Core Concept

The architecture uses a decoupled, event-driven approach to create a robust and scalable data ingestion system. It leverages Cloud Workflows as a central orchestrator and Pub/Sub for decoupling services.

---

### Proposed Centralized Architecture

Here is the step-by-step flow:

**1. UI Upload to Cloud Storage**
- The React UI requests a secure, signed URL from a backend HTTP Cloud Function.
- The UI uses this URL to upload a file (PPT, video, audio, email, etc.) directly to a dedicated Cloud Storage bucket. This is both efficient and secure.

**2. Event-Driven Trigger via Eventarc**
- The new file in Cloud Storage automatically emits an event.
- **Eventarc**, acting as a central event bus, captures this event and triggers the main processing workflow.

**3. Orchestration with Cloud Workflows (The "Central" Logic)**
- Eventarc invokes a **Cloud Workflow**, which serves as the central definition of the "mcp" pipeline.
- The workflow executes the following steps in a managed, observable sequence:
    1.  **Content Extraction:** Calls a specialized Cloud Function (e.g., `process-document`) to extract text content from the uploaded file using the appropriate service (e.g., Document AI for PDFs, Speech-to-Text for audio).
    2.  **Vectorization with Gemini:** Takes the extracted text and calls the Vertex AI API to generate vector embeddings using a Gemini model (e.g., Gemini 1.5 Flash).
    3.  **Store in Firestore:** Writes the extracted text, vector embeddings, and any relevant metadata as a new document into a Firestore collection.

**4. Decoupling with Pub/Sub for Downstream Flows**
- After the data is successfully stored, the final step in the Cloud Workflow is to publish a message to a **Pub/Sub topic** (e.g., `new-document-ready`). This message should contain a unique identifier, like the Firestore `documentId`.
- Any "other flows" (implemented as separate Cloud Functions or Cloud Run services) subscribe to this Pub/Sub topic.
- When a subscriber receives a message, it knows new data is available and can use the `documentId` to fetch the processed content from Firestore to perform its specific task.

---

### Benefits of this Architecture

- **Centralized Management:** Cloud Workflows provides a single place to view, manage, and audit the entire ingestion pipeline.
- **Decoupling:** The ingestion process is completely separate from the services that consume the data. You can add or change consumers without touching the ingestion logic.
- **Scalability & Resilience:** Each step is an independent, scalable microservice. Cloud Workflows provides built-in support for retries and error handling, making the pipeline more resilient.

---

### Cost Considerations

Providing an exact cost is difficult as it depends heavily on usage (volume of data, number of requests, etc.). However, this serverless architecture is generally very cost-effective, especially at low to moderate scale, because you only pay for what you use. Most services have a generous perpetual free tier.

Here is a breakdown of the pricing models for the services used:

-   **Cloud Storage:** Priced per GB-month of data stored, plus small costs for operations and data transfer. A free tier is included.
-   **Eventarc:** Priced per million events delivered. A free tier for events from Google Cloud sources is included.
-   **Cloud Workflows:** Priced based on the number of internal and external steps executed. A generous free tier is included.
-   **Cloud Functions:** Priced per invocation, CPU time, and memory usage. A large perpetual free tier is included.
-   **Vertex AI (Gemini API):** Priced per 1,000 characters of input and output. There is no free tier for the API itself, so this will be a primary driver of cost.
-   **Firestore:** Priced based on the amount of data stored (GB/month) and the number of read/write/delete operations. A perpetual free tier is included.
-   **Pub/Sub:** Priced on the volume of message data transferred per month. A free tier is included.

**Conclusion on Cost:**
For a startup or a project with low initial traffic, the costs are likely to be very low (potentially close to $0) due to the generous free tiers for most services. The main variable cost will be the calls to the Vertex AI (Gemini) API.

To get a more precise estimate, it is highly recommended to use the [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) with your expected usage patterns.
