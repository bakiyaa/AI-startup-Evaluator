#!/bin/bash

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
# Replace the following placeholder values with your actual configuration.

# GCP Project Configuration
GCP_PROJECT_ID="your-gcp-project-id"
GCP_REGION="us-central1"

# Service Account Configuration
SERVICE_ACCOUNT_NAME="startup-evaluator-sa"

# GCS Configuration
GCS_BUCKET_NAME="your-unique-bucket-name"

# Firestore Configuration
FIRESTORE_COLLECTION_NAME="deal-notes"

# Cloud Functions Configuration
GENERATE_SIGNED_URL_FUNCTION_NAME="generateSignedUrl"
PROCESS_DOCUMENT_FUNCTION_NAME="processDocument"

# ------------------------------------------------------------------------------
# Script Start
# ------------------------------------------------------------------------------

echo "Starting infrastructure setup for project: $GCP_PROJECT_ID"

# Set the project for the gcloud commands
gcloud config set project $GCP_PROJECT_ID

# ------------------------------------------------------------------------------
# Enable GCP APIs
# ------------------------------------------------------------------------------
echo "Enabling necessary GCP APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  cloudfunctions.googleapis.com \
  vision.googleapis.com \
  speech.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com \
  storage-component.googleapis.com

# ------------------------------------------------------------------------------
# Create Service Account and Grant IAM Roles
# ------------------------------------------------------------------------------
echo "Creating service account: $SERVICE_ACCOUNT_NAME..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="Service Account for AI Startup Evaluator"

SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com"

echo "Granting IAM roles to the service account..."
# Roles for generateSignedUrl function
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectCreator"

# Roles for processDocument function
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectViewer"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.user"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/vision.user"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/speech.user"
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"


# ------------------------------------------------------------------------------
# Create GCS Bucket
# ------------------------------------------------------------------------------
echo "Creating GCS bucket: $GCS_BUCKET_NAME..."
gsutil mb -p $GCP_PROJECT_ID -l $GCP_REGION gs://$GCS_BUCKET_NAME

# ------------------------------------------------------------------------------
# Create Firestore Database
# ------------------------------------------------------------------------------
echo "Creating Firestore database..."
gcloud firestore databases create --location=$GCP_REGION

# ------------------------------------------------------------------------------
# Deploy Cloud Functions
# ------------------------------------------------------------------------------
echo "Deploying Cloud Functions..."

# Deploy generateSignedUrl function
echo "Deploying $GENERATE_SIGNED_URL_FUNCTION_NAME function..."
gcloud functions deploy $GENERATE_SIGNED_URL_FUNCTION_NAME \
  --runtime=nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region=$GCP_REGION \
  --source=./functions \
  --entry-point=generateSignedUrl \
  --service-account=$SERVICE_ACCOUNT_EMAIL \
  --set-env-vars=GCS_BUCKET_NAME=$GCS_BUCKET_NAME

# Deploy processDocument function
echo "Deploying $PROCESS_DOCUMENT_FUNCTION_NAME function..."
gcloud functions deploy $PROCESS_DOCUMENT_FUNCTION_NAME \
  --runtime=nodejs18 \
  --trigger-resource=$GCS_BUCKET_NAME \
  --trigger-event=google.storage.object.finalize \
  --region=$GCP_REGION \
  --source=./functions \
  --entry-point=processDocument \
  --service-account=$SERVICE_ACCOUNT_EMAIL \
  --set-env-vars=GCS_BUCKET_NAME=$GCS_BUCKET_.NAME,FIRESTORE_COLLECTION_NAME=$FIRESTORE_COLLECTION_NAME,GCP_PROJECT=$GCP_PROJECT_ID

# ------------------------------------------------------------------------------
# Script End
# ------------------------------------------------------------------------------
echo "Infrastructure setup completed successfully!"

# ------------------------------------------------------------------------------
# Update .env.local file
# ------------------------------------------------------------------------------
echo "Updating .env.local file..."

ENV_FILE=".env.local"

# Function to update or add a variable to the .env.local file
update_env_var() {
  local var_name=$1
  local var_value=$2
  if grep -q "^$var_name=" "$ENV_FILE"; then
    # Variable exists, so we replace it
    sed -i "s|^$var_name=.*|$var_name=$var_value|" "$ENV_FILE"
  else
    # Variable does not exist, so we append it
    echo "$var_name=$var_value" >> "$ENV_FILE"
  fi
}

# Create the file if it doesn't exist
touch $ENV_FILE

# Update the variables
update_env_var "REACT_APP_PROJECT_ID" "$GCP_PROJECT_ID"
update_env_var "REACT_APP_STORAGE_BUCKET" "$GCS_BUCKET_NAME"
SIGNED_URL_FUNCTION_URL=$(gcloud functions describe $GENERATE_SIGNED_URL_FUNCTION_NAME --region=$GCP_REGION --format='value(https_trigger.url)')
update_env_var "REACT_APP_SIGNED_URL_FUNCTION_URL" "$SIGNED_URL_FUNCTION_URL"

echo ".env.local file updated successfully!"
echo "Please fill in the remaining values in .env.local (e.g., Firebase credentials)."

