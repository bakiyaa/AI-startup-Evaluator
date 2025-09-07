#!/bin/bash

# This script sets up the necessary GCP infrastructure for the AI Startup Evaluator application using Terraform.
#
# IMPORTANT:
# 1. Make sure you have the gcloud CLI and Terraform installed and authenticated.
# 2. Make sure your .env file is populated with the correct values.

# --- Configuration ---
if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# --- Terraform Setup ---

echo "--- Initializing Terraform ---"
(cd terraform && terraform init -reconfigure)

echo "--- Applying Terraform configuration ---"
(cd terraform && terraform apply -auto-approve \
  -var="gcp_project_id=$GCP_PROJECT_ID" \
  -var="gcp_region=$GCP_REGION" \
  -var="gcp_bucket_name=$GCP_BUCKET_NAME" \
  -var="existing_service_account_email=$EXISTING_SERVICE_ACCOUNT_EMAIL" \
  -var="gemini_api_key=$GEMINI_API_KEY")

echo "--- Infrastructure setup complete ---"
