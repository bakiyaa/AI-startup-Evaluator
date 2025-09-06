# UML Diagram (Text-based)

This document contains a text-based representation of the UML sequence diagram for the "Ingest and Analyze a Pitch Deck" use case. You can render this using a Mermaid diagram viewer.

```mermaid
sequenceDiagram
    participant User
    participant ReactApp as React App (ADK)
    participant GCS as Google Cloud Storage
    participant CloudFunction as Cloud Function
    participant GeminiAPI as Gemini API
    participant Firestore

    User->>ReactApp: Uploads Pitch Deck
    ReactApp->>GCS: Stores Pitch Deck
    GCS-->>CloudFunction: Triggers on new file
    CloudFunction->>GCS: Downloads Pitch Deck
    CloudFunction->>GeminiAPI: Sends file content for analysis
    GeminiAPI-->>CloudFunction: Returns analysis
    CloudFunction->>Firestore: Stores analysis
    Firestore-->>ReactApp: Real-time update
    ReactApp-->>User: Displays analysis
```
