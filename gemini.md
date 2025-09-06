# AI-Powered Analyst (ADK Model)

This document outlines the use cases, architecture, and implementation instructions for the AI-Powered Analyst application.

## Use Case 1: Ingest and Analyze a Pitch Deck

**Description:** This use case covers the process of uploading a pitch deck (PDF document), analyzing it with an AI model, and displaying the generated deal notes.

**Architecture:**

```
[User with Browser] -> [React App (ADK Model)] -> [Google Cloud Storage]
                                                    |
                                                    v
                                          [Cloud Function (Trigger)]
                                                    |
                                                    v
                                          [Gemini API (Analysis)]
                                                    |
                                                    v
                                          [Firebase Firestore (Storage)]
                                                    ^
                                                    |
[User with Browser] <- [React App (ADK Model)] <- (Real-time updates)
```

**GCP Services Used:**

*   **Google Cloud Storage:** To store the uploaded pitch deck files.
*   **Cloud Functions:** To trigger the analysis pipeline when a new file is uploaded.
*   **Gemini API:** To perform the AI-powered analysis of the pitch deck.
*   **Firebase Firestore:** To store the structured deal notes and analysis results.

**Implementation Instructions:**

1.  **Set up Google Cloud Project:**
    *   Create a new project in the Google Cloud Console.
    *   Enable the necessary APIs: Cloud Storage, Cloud Functions, Gemini API, and Firestore.

2.  **Configure Firebase:**
    *   Create a new Firebase project and link it to your Google Cloud project.
    *   Set up Firestore in your Firebase project.

3.  **Frontend (React App - ADK Model):**
    *   Integrate the Firebase SDK for JavaScript.
    *   Modify the file upload component to upload files directly to a specified Google Cloud Storage bucket.
    *   Implement a real-time listener to a Firestore collection to display the analysis results as they become available.

4.  **Backend (Cloud Function):**
    *   Create a new Cloud Function that is triggered by new object creation in the Cloud Storage bucket.
    *   In the Cloud Function:
        *   Download the uploaded file from Cloud Storage.
        *   If the file is a PDF, use a library to extract the text content.
        *   Call the Gemini API with the extracted text to generate deal notes.
        *   Store the generated deal notes in a Firestore collection, linking it to the uploaded file.

5.  **Run and Test:**
    *   Deploy the Cloud Function.
    *   Run the React application.
    *   Upload a pitch deck and verify that the analysis appears on the page.
