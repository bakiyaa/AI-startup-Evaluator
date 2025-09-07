# Use Case 3: Risk Heatmap and Scoring

## 1. Functionality

This use case is about identifying and visualizing potential risks. The system will analyze the structured deal notes to flag inconsistencies, inflated market size, or unusual churn patterns. The identified risks will be displayed in an intuitive heatmap format, with a corresponding risk score.

## 2. GCP Architecture

```mermaid
graph TD
    A[Cloud Function from Use Case 1] -->|Analyzes Deal Notes| B(Gemini API)
    B -->|Returns Risk Analysis| A
    A -->|Saves Risk Score| C(Firestore)
    C -->|Real-time Update| D(React App)
    D -->|Displays Heatmap| E[User]
```

## 3. UML Diagram

```mermaid
sequenceDiagram
    participant CloudFunction as Cloud Function
    participant GeminiAPI as Gemini API
    participant Firestore
    participant ReactApp as React App
    participant User

    CloudFunction->>GeminiAPI: Sends deal notes for risk analysis
    GeminiAPI-->>CloudFunction: Returns identified risks and scores
    CloudFunction->>Firestore: Stores risk analysis
    Firestore-->>ReactApp: Real-time update
    ReactApp-->>User: Displays risk heatmap
```

## 4. Low-Cost / Free Tier Strategy

*   **Gemini API:** Continue to use the free tier for development and testing.
*   **Cloud Functions and Firestore:** The cost will be minimal, as this function will be triggered as part of the main analysis workflow. The additional storage in Firestore will be negligible.
