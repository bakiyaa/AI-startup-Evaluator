# Use Case 2: Dynamic KPI Metrics and Benchmarking

## 1. Functionality

This use case focuses on providing a comparative analysis of the startup. The system will display visual charts that benchmark the startup's key performance indicators (KPIs) against sector peers. This will help investors quickly understand how the startup is performing relative to the market.

## 2. GCP Architecture

```mermaid
graph TD
    A[User] -->|Views Dashboard| B(React App)
    B -->|Requests Data| D(Cloud Function)
    D -->|Gets Startup Metrics| G(Firestore)
    D -->|Gets Benchmark Data| H(BigQuery)
    H -->|External Data| I(Vertex AI Search)
    D -->|Returns Data| B
    B -->|Displays Charts| A
```

## 3. UML Diagram

```mermaid
sequenceDiagram
    participant User
    participant ReactApp as React App
    participant CloudFunction as Cloud Function
    participant Firestore
    participant BigQuery
    participant VertexAISearch as Vertex AI Search

    User->>ReactApp: Navigates to Dashboard
    ReactApp->>CloudFunction: Requests benchmark data
    CloudFunction->>Firestore: Gets startup's KPIs
    CloudFunction->>BigQuery: Queries for sector benchmarks
    CloudFunction->>VertexAISearch: Searches for public data on competitors
    VertexAISearch-->>CloudFunction: Returns competitor data
    CloudFunction->>BigQuery: Augments benchmark data
    BigQuery-->>CloudFunction: Returns final benchmark data
    CloudFunction-->>ReactApp: Returns data to frontend
    ReactApp-->>User: Displays KPI charts
```

## 4. Low-Cost / Free Tier Strategy

*   **BigQuery:** The first 1 TB of queries per month is free. Structure your data and queries to minimize the amount of data scanned. You also get 10 GB of storage for free.
*   **Vertex AI Search:** Pricing is based on the number of queries and the size of the index. Start with a small index and a limited number of queries to keep costs low during development.
*   **Cloud Functions and Firestore:** Continue to leverage the free tiers as described in Use Case 1.
