# Use Case 2: Hybrid AI-Analytics for Benchmarking and Forecasting

## 1. Functionality

This use case specifies a powerful and cost-effective hybrid architecture for startup analysis. It combines the strengths of AI-native services with powerful analytics engines.

First, **Vertex AI Vector Search** is used to perform a semantic search on unstructured deal notes (from Firestore) to find a startup's true peer group. Then, **BigQuery**, which stores structured KPI data (financials, hiring metrics, etc.), is used to perform fast and efficient benchmark calculations on that AI-curated peer group.

Vectorization of the deal notes is an **on-demand process** initiated from the UI. A user can choose to vectorize a single note or run a batch process to vectorize all historical notes. The final analysis capabilities are exposed via a flexible **Model Context Protocol (MCP) server**.

## 2. GCP Hybrid Architecture

```mermaid
graph TD
    subgraph Data Ingestion
        A[Raw Data: Pitch Decks] -->|Stored in| B(Cloud Storage)
        C[Structured KPI Data] --> D(BigQuery)
        E[Unstructured Deal Notes] --> F(Firestore)
    end

    subgraph Analysis & Serving
        G[User] --> H(React App)
        
        subgraph On-Demand Vectorization
            H -->|1. Triggers| I(HTTP Cloud Function)
            I -->|2. Reads Notes| F
            I -->|3. Generates Embeddings| J(Vertex AI Embedding Model)
            J -->|4. Stores Vectors| K(Vertex AI Vector Search)
        end

        subgraph AI-Powered Analysis
            H -->|Initiates Analysis| L["ADK Agent (MCP Client)"]
            L -->|Connects to| M[MCP Server on Cloud Run]
            M --> N((Analysis Cache in Firestore))
            
            subgraph MCP Tools
                M --> O(Benchmarking Tool)
                M --> P(Forecasting Tool)
                M --> Q(Suggestion Tool)
            end

            O -->|Finds Peer IDs| K
            O -->|Calculates Benchmarks| D
            P -->|Gets Historical KPIs| D
            Q -->|Synthesizes Insights| R(Vertex AI - Gemini API)
        end

        L -->|Stores/Retrieves| N
        L -->|Returns Final Analysis| H
    end
```

## 3. Cost Optimization

To ensure the platform is both powerful and low-cost, a caching strategy is essential:

*   **Analysis Caching:** The final output of an analysis (benchmarks, risk flags, suggestions) is stored in a dedicated Firestore document. When a user views a startup, the UI first attempts to load this cached result, which is extremely fast and inexpensive.
*   **On-Demand Recalculation:** The expensive, full analysis pipeline (involving Vector Search, BigQuery, and Gemini) is only triggered if no cached result exists or if the user explicitly requests a refresh. This dramatically reduces API calls and query costs for routine dashboard views.
*   **Data Segregation:** Storing structured KPI data in BigQuery is optimal for analytical queries, while unstructured notes are kept in Firestore. This ensures the right database is used for the right job, optimizing both cost and performance.

## 4. UML Sequence Diagram

This diagram shows the flow for a **cache miss**, where a full recalculation is needed.

```mermaid
sequenceDiagram
    participant User
    participant ReactApp
    participant ADKAgent as ADK Agent (MCP Client)
    participant Cache as Firestore Cache
    participant MCPServer as MCP Server
    participant VectorSearch as Vertex AI Vector Search
    participant BigQuery
    participant Gemini

    User->>ReactApp: Request analysis for a startup
    ReactApp->>ADKAgent: Start analysis(startupId)
    ADKAgent->>Cache: Check for cached result(startupId)
    Cache-->>ADKAgent: Return null (cache miss)

    ADKAgent->>MCPServer: Call Benchmarking Tool(startupId)
    MCPServer->>VectorSearch: Find similar startup vectors
    VectorSearch-->>MCPServer: Return peer startup IDs
    MCPServer->>BigQuery: Calculate benchmarks for peer IDs
    BigQuery-->>MCPServer: Return calculated benchmark data
    MCPServer-->>ADKAgent: Return benchmark analysis

    ADKAgent->>MCPServer: Call Suggestion Tool with analysis data
    MCPServer->>Gemini: Generate investment suggestions
    Gemini-->>MCPServer: Return suggestions
    MCPServer-->>ADKAgent: Return final suggestions

    ADKAgent->>Cache: Store new result(startupId, analysisData)
    ADKAgent-->>ReactApp: Return complete analysis package
    ReactApp-->>User: Display dashboards and suggestions
```