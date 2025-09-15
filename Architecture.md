# Technical Architecture

## 1. Overall Architecture

The platform is built on a modern, scalable, and serverless architecture using Google Cloud Platform (GCP). It is designed as a multi-agent system, where a central orchestrator manages a team of specialized agents, each responsible for a specific part of the analysis workflow.

The architecture is designed to be:

*   **Scalable:** Using serverless components like Cloud Functions and Cloud Run, the system can automatically scale to handle any workload.
*   **Modular:** The multi-agent design makes the system highly modular, allowing for new features and capabilities to be added easily by creating new agents.
*   **Cost-Effective:** The use of serverless components and a focus on free-tier services makes the platform very cost-effective to operate.

## 2. User Interface (UI)

The UI is a single-page application built with **React.js**. It provides a user-friendly and interactive workspace for the analyst. The key components are:

*   **`InvestmentAnalystPage.js`:** The main component that orchestrates the entire UI.
*   **`DealInformation.js`:** For uploading documents and providing deal information.
*   **`Controls.js`:** For setting analysis preferences and triggering the analysis.
*   **`InsightDashboard.js`:** For displaying the results of the analysis in a tabbed interface.

## 3. Multi-Agent System with Agent Builder

The core of the backend is a multi-agent system orchestrated by **Agent Builder**, which acts as the **Model Context Protocol (MCP) server**.

*   **Agent Builder (Orchestrator):** This is the central "brain" of the system. It receives requests from the frontend, understands the user's intent, and then delegates tasks to the appropriate specialized agents in the correct sequence. It manages the flow of data between the agents and ensures that the entire analysis process is executed smoothly.

*   **Specialized Agents:** These are individual cloud functions, each with a specific, well-defined role. The key agents are:

    *   **Data Ingestion Agent:** Handles the ingestion of all founder materials. It uses **Cloud Vision API** for OCR and **Speech-to-Text** for transcription.
    *   **Analysis Agent:** Performs the core analysis of the startup. It uses **Vertex AI Vector Search** to find peer groups, **BigQuery** to calculate benchmarks, and the **Gemini API** to generate qualitative insights.
    *   **Risk Agent:** Specializes in risk analysis. It analyzes the deal notes to identify and score potential risks.
    *   **Reporting Agent:** Takes the structured JSON output from the other agents and formats it into the final, user-facing report.
    *   **Investor Interaction Agent:** Manages the user's preferences, such as the custom weightages for the recommendation engine.
    *   **Voice Agent:** Handles all voice-based interactions with the user. It uses **Dialogflow** for conversational flow and the **Gemini API** for natural language understanding and response generation.

## 4. Architecture Diagram

```mermaid
graph TD
    subgraph User Interface (React App)
        A[DealInformation.js]
        B[Controls.js]
        C[InsightDashboard.js]
    end

    subgraph Backend (Agent-based on GCP)
        D(Agent Builder - Orchestrator/MCP)

        subgraph Specialized Agents (Cloud Functions)
            E(Data Ingestion Agent)
            F(Analysis Agent)
            G(Risk Agent)
            H(Reporting Agent)
            I(Investor Interaction Agent)
            J(Voice Agent)
        end

        subgraph GCP Services (Tools)
            K[Cloud Storage]
            L[Cloud Vision AI]
            M[Speech-to-Text]
            N[Firestore]
            O[BigQuery]
            P[Vertex AI Vector Search]
            Q[Gemini API]
            R[Dialogflow]
        end
    end

    A -- Uploads Files & Deal Info --> D
    B -- Sends Preferences & Triggers Analysis --> D

    D -- Triggers --> E
    D -- Delegates to --> F
    D -- Delegates to --> G
    D -- Delegates to --> H
    D -- Delegates to --> I
    D -- Interacts with --> J

    E -- Uses --> K
    E -- Uses --> L
    E -- Uses --> M
    E -- Writes to --> N

    F -- Reads from --> N
    F -- Queries --> O
    F -- Queries --> P
    F -- Uses --> Q

    G -- Reads from --> N
    G -- Uses --> Q

    H -- Reads from --> N

    I -- Writes to --> N

    J -- Uses --> R
    J -- Uses --> Q

    D -- Returns Final Report --> C
```
