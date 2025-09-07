# Use Case 1: Document Upload and AI-Powered Analysis

## 1. Functionality

This use case covers the initial ingestion and analysis of startup documents. The user will be able to upload documents through two distinct interfaces:
1.  **Pitch Deck Upload:** For pitch decks in PDF or PPT format.
2.  **Supporting Document Upload:** For other documents such as call transcripts (text or audio), founder updates (emails, PDFs), and emails (plain text or HTML).

The system will automatically extract the text from these documents and generate structured deal notes.

## 2. GCP Architecture

```mermaid
graph TD
    A[User] -->|Uploads Pitch Deck| B(React App)
    A -->|Uploads Supporting Docs| B
    B -->|Stores File| C(Google Cloud Storage)
    C -->|Triggers| D(Cloud Function)
    D -->|Extracts Text| E{Cloud Vision AI / Speech-to-Text}
    D -->|Generates Notes| F(Gemini API)
    D -->|Saves Notes| G(Firestore)
    G -->|Real-time Update| B
```

## 3. UML Diagram

```mermaid
sequenceDiagram
    participant User
    participant ReactApp as React App
    participant GCS as Google Cloud Storage
    participant CloudFunction as Cloud Function
    participant VisionAPI as Cloud Vision API
    participant GeminiAPI as Gemini API
    participant Firestore

    User->>ReactApp: Uploads Pitch Deck
    ReactApp->>GCS: Stores Pitch Deck
    GCS-->>CloudFunction: Triggers on new file

    User->>ReactApp: Uploads Supporting Document
    ReactApp->>GCS: Stores Supporting Document
    GCS-->>CloudFunction: Triggers on new file

    CloudFunction->>GCS: Downloads File
    CloudFunction->>VisionAPI: Extracts text from file
    VisionAPI-->>CloudFunction: Returns extracted text
    CloudFunction->>GeminiAPI: Sends text for analysis
    GeminiAPI-->>CloudFunction: Returns structured deal notes
    CloudFunction->>Firestore: Stores deal notes
    Firestore-->>ReactApp: Real-time update
    ReactApp-->>User: Displays deal notes
```

## 4. Low-Cost / Free Tier Strategy

*   **Cloud Functions:** The first 2 million invocations per month are free. This should be more than enough for development and early-stage use.
*   **Google Cloud Storage:** The first 5 GB-months of standard storage are free. You can also set up lifecycle rules to automatically move older files to cheaper storage classes like Nearline or Coldline.
*   **Cloud Vision AI:** The first 1,000 units per month are free for OCR. This is sufficient for processing a good number of pitch decks during development.
*   **Gemini API:** The free tier provides a generous number of requests per minute.
*   **Firestore:** The free tier includes 1 GiB of storage and 50,000 read/20,000 write operations per day.
