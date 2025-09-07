#!/bin/bash

# This script sets up the necessary GCP infrastructure for the AI Startup Evaluator application.
#
# IMPORTANT:
# 1. Make sure you have the gcloud CLI installed and authenticated.
# 2. Replace the placeholder values (e.g., YOUR_PROJECT_ID) with your actual values.

# --- Configuration ---
export PROJECT_ID="YOUR_PROJECT_ID_HERE" # <-- IMPORTANT: REPLACE THIS WITH YOUR ACTUAL GCP PROJECT ID
export REGION="us-central1" # Choose the region that is best for you
export BUCKET_NAME="usecase1-your-unique-name" # <-- IMPORTANT: REPLACE THIS WITH A GLOBALLY UNIQUE BUCKET NAME
export SERVICE_ACCOUNT_NAME="cloud-function-runner"

# --- Setup ---

echo "--- Setting project to $PROJECT_ID ---"
gcloud config set project $PROJECT_ID

echo "--- Enabling required APIs ---"
gcloud services enable \
  cloudfunctions.googleapis.com \
  storage.googleapis.com \
  vision.googleapis.com \
  speech.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com

echo "--- Creating Firestore database ---"
# Note: Firestore can only be created once per project. If you already have one, this will fail.
gcloud firestore databases create --location=$REGION

echo "--- Creating Cloud Storage bucket: $BUCKET_NAME ---"
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION

echo "--- Creating service account: $SERVICE_ACCOUNT_NAME ---"
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="Cloud Function Runner"

# Construct the full service account email
export SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "--- Granting IAM roles to service account ---"
# Grant roles to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudfunctions.invoker"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/vision.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudtranslate.user" # Note: Speech-to-Text uses the Cloud Translation role

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.user" # Note: Firestore uses the Datastore role

echo "--- Infrastructure setup complete ---"
echo "Remember to update your .env file with your project details."
