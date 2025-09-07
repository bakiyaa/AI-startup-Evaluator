# Use Case 5: Scenario Comparison and Recommendation Engine

## 1. Functionality

This use case allows investors to tailor the investment recommendation to their specific preferences. Users can adjust the weightages of different evaluation criteria (e.g., team, product, market), and the system will generate a new recommendation based on the updated weights. This allows for a more personalized and transparent decision-making process.

## 2. GCP Architecture

```mermaid
graph TD
    A[User] -->|Adjusts Weights| B(React App)
    B -->|Sends Weights & Data| C(Cloud Function)
    C -->|Generates Recommendation| D(Gemini API)
    C -->|Returns Recommendation| B
    B -->|Displays Recommendation| A
```

## 3. UML Diagram

```mermaid
sequenceDiagram
    participant User
    participant ReactApp as React App
    participant CloudFunction as Cloud Function
    participant GeminiAPI as Gemini API

    User->>ReactApp: Adjusts investment criteria weights
    ReactApp->>CloudFunction: Sends weights and analysis data
    CloudFunction->>GeminiAPI: Requests a new recommendation with the given weights
    GeminiAPI-->>CloudFunction: Returns a weighted investment recommendation
    CloudFunction-->>ReactApp: Returns the new recommendation
    ReactApp-->>User: Displays the updated recommendation
```

## 4. Low-Cost / Free Tier Strategy

*   **Gemini API:** Continue to use the free tier for development and testing.
*   **Cloud Functions:** The cost will be minimal, as this function will only be triggered when the user changes the weightages.
