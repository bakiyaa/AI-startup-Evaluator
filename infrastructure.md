# Infrastructure Setup Guide

This guide provides step-by-step instructions for setting up the Google Cloud Platform (GCP) infrastructure required for this application, as described in `usecase1.md`.

## 1. Create a GCP Project

1.  Go to the [GCP Console](https://console.cloud.google.com/).
2.  Click the project drop-down menu at the top of the page and click **New Project**.
3.  Give your project a name (e.g., `ai-startup-evaluator`) and click **Create**.

## 2. Enable Required APIs

For your new project, you need to enable the following APIs:

1.  Go to the [API Library](https://console.cloud.google.com/apis/library).
2.  Search for and enable each of the following APIs one by one:
    *   **Cloud Storage**
    *   **Cloud Functions API**
    *   **Cloud Vision AI API**
    *   **Speech-to-Text API**
    *   **Cloud Firestore API**
    *   **Identity and Access Management (IAM) API**

## 3. Set Up Firestore

1.  In the GCP Console, navigate to **Firestore**.
2.  Click **Create Database**.
3.  Choose **Native mode** and select a location for your database.
4.  Click **Create**.
5.  Once the database is created, go to the **Data** tab.
6.  Click **Start collection**.
7.  Enter `deal-notes` as the **Collection ID** and click **Save**.

## 4. Set Up Cloud Storage

1.  In the GCP Console, navigate to **Cloud Storage**.
2.  Click **Create bucket**.
3.  Give your bucket a unique name. This name must be globally unique.
4.  Choose a location for your bucket.
5.  Leave the other settings as default and click **Create**.

## 5. Create a Service Account

A service account is needed for the Cloud Function to securely interact with other GCP services.

1.  In the GCP Console, navigate to **IAM & Admin > Service Accounts**.
2.  Click **Create Service Account**.
3.  Give the service account a name (e.g., `cloud-function-runner`).
4.  Click **Create and Continue**.
5.  Grant the following roles to the service account:
    *   `Cloud Functions Invoker`
    *   `Storage Object Admin`
    *   `Cloud Vision AI User`
    *   `Cloud Translation API User` (Speech-to-Text uses this)
    *   `Firestore User`
6.  Click **Continue** and then **Done**.

## 6. Update Frontend Configuration

Once you have created your GCP project and set up Firebase, you need to update the `src/firebaseConfig.js` file in your React application.

1.  Go to your project's settings in the [Firebase Console](https://console.firebase.google.com/).
2.  Under "Your apps", select your web app.
3.  You will find your Firebase configuration object there. Copy the values for `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.
4.  Open `src/firebaseConfig.js` in your code editor and replace the placeholder values with your actual credentials.

## 7. Cloud Function Implementation (Placeholder)

You will need to create a Cloud Function that is triggered by uploads to your Cloud Storage bucket. Here is a basic outline of the function code (`index.js`):

```javascript
const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SpeechClient } = require('@google-cloud/speech');
const { Firestore } = require('@google-cloud/firestore');
const { Gemini } = require('@google/generative-ai'); // This is a placeholder for the Gemini SDK

// Initialize clients
const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const firestore = new Firestore();
const genAI = new Gemini({ apiKey: 'YOUR_GEMINI_API_KEY' }); // Replace with your API key

functions.cloudEvent('process-document', async (cloudEvent) => {
  const bucket = cloudEvent.data.bucket;
  const file = cloudEvent.data.name;

  console.log(`Processing file: ${file}`);

  // 1. Download the file from Cloud Storage
  const fileBuffer = await storage.bucket(bucket).file(file).download();

  let extractedText = '';

  // 2. Extract text based on file type
  if (file.endsWith('.pdf')) {
    // Use Vision AI for PDF
    const [result] = await visionClient.documentTextDetection(fileBuffer);
    extractedText = result.fullTextAnnotation.text;
  } else if (file.endsWith('.wav') || file.endsWith('.mp3')) {
    // Use Speech-to-Text for audio
    const [response] = await speechClient.recognize({
      audio: { content: fileBuffer.toString('base64') },
      config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' },
    });
    extractedText = response.results.map(result => result.alternatives[0].transcript).join('\n');
  } else {
    // For plain text
    extractedText = fileBuffer.toString('utf-8');
  }

  // 3. Generate notes with Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `Analyze the following document and generate structured deal notes in JSON format with the following fields: companyName, problem, solution, market, financials, risks.

${extractedText}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const dealNotes = JSON.parse(response.text());

  // 4. Save notes to Firestore
  await firestore.collection('deal-notes').add(dealNotes);

  console.log('Deal notes saved to Firestore.');
});
```

This guide should provide a solid foundation for setting up your backend.