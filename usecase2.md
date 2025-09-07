# Use Case 2: Hybrid AI-Analytics for Benchmarking and Forecasting

## 1. Functionality

This use case specifies a powerful and cost-effective hybrid architecture for startup analysis. It combines the strengths of AI-native services with powerful analytics engines.

First, **Vertex AI Vector Search** is used to perform a semantic search and identify a startup's true peer group based on deep similarity, not just industry tags. Then, **BigQuery** is used to perform fast and efficient benchmark calculations (averages, medians, etc.) on the KPI data of this AI-curated peer group. 

This approach ensures highly relevant, nuanced benchmarking while leveraging BigQuery's cost-effective analytical power. The framework also includes tools for forecasting and generating investment suggestions with Gemini, all exposed via a flexible **Model Context Protocol (MCP) server**.

## 2. GCP Hybrid Architecture

```mermaid
graph TD
    subgraph Data Ingestion & Vectorization
        A[Raw Data: Pitch Decks, Notes] -->|Stored in| B(Cloud Storage)
        B -->|Triggers| C[Cloud Function]
        C -->|Generates Embeddings| D(Vertex AI Embedding Model)
        D -->|Stores Vectors| E(Vertex AI Vector Search)
        A -->|Structured KPIs| F(BigQuery / Firestore)
    end

    subgraph Analysis & Serving
        G[User] --> H(React App)
        H -->|Initiates Analysis| I{ADK Agent (MCP Client)}
        I -->|Connects to| J[MCP Server on Cloud Run]
        
        subgraph MCP Tools
            J --> K(Benchmarking Tool)
            J --> L(Forecasting Tool)
            J --> M(Suggestion Tool)
        end

        K -->|1. Find Peer IDs| E
        K -->|2. Calculate Benchmarks| F
        L -->|Gets Historical KPIs| F
        M -->|Synthesizes Insights| N(Vertex AI - Gemini API)
    end

    I -->|Returns Final Analysis| H
```

## 3. UML Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant ReactApp
    participant ADKAgent as ADK Agent (MCP Client)
    participant MCPServer as MCP Server
    participant VectorSearch as Vertex AI Vector Search
    participant BigQuery
    participant Gemini

    User->>ReactApp: Request analysis for a startup
    ReactApp->>ADKAgent: Start analysis(startupId)

    ADKAgent->>MCPServer: Call Benchmarking Tool(startupId)
    MCPServer->>VectorSearch: Find similar startup vectors
    VectorSearch-->>MCPServer: Return peer startup IDs
    MCPServer->>BigQuery: Calculate benchmarks for peer IDs
    BigQuery-->>MCPServer: Return calculated benchmark data
    MCPServer-->>ADKAgent: Return benchmark analysis

    ADKAgent->>MCPServer: Call Forecasting Tool(startupId)
    MCPServer->>BigQuery: Get historical KPIs for startup
    BigQuery-->>MCPServer: Return time-series data
    MCPServer-->>ADKAgent: Return forecast data

    ADKAgent->>MCPServer: Call Suggestion Tool with analysis data
    MCPServer->>Gemini: Generate investment suggestions from data
    Gemini-->>MCPServer: Return text suggestions
    MCPServer-->>ADKAgent: Return final suggestions

    ADKAgent-->>ReactApp: Return complete analysis package
    ReactApp-->>User: Display dashboards and suggestions
```