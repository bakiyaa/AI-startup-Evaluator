# Terraform configuration to set up the required providers.
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    archive = {
      source = "hashicorp/archive"
      version = "~> 2.2.0"
    }
  }
}

# Provider block to configure the Google Cloud provider with the project and region.
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Resource to enable the necessary Google Cloud APIs for the project.
resource "google_project_service" "apis" {
  count   = length(local.apis)
  project = var.gcp_project_id
  service = local.apis[count.index]

  disable_on_destroy = false
}

# Resource to create a Google Cloud Storage bucket.
resource "google_storage_bucket" "bucket" {
  name          = var.gcp_bucket_name
  location      = var.gcp_region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Data source to create a zip archive of the Cloud Function source code.
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "../functions"
  output_path = "/tmp/functions.zip"
}

# Resource to upload the zip archive to the Cloud Storage bucket.
resource "google_storage_bucket_object" "archive" {
  name   = "functions.zip"
  bucket = google_storage_bucket.bucket.name
  source = data.archive_file.source.output_path
}

# Resource to create the Google Cloud Function.
resource "google_cloudfunctions_function" "function" {
  name        = "process-document"
  description = "Processes uploaded documents."
  runtime     = "nodejs20"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "process-document"

  # Trigger the function when a new object is created in the Cloud Storage bucket.
  event_trigger {
    event_type = "google.storage.object.finalize"
    resource   = google_storage_bucket.bucket.name
  }

  # Pass the Gemini API key as an environment variable to the function.
  environment_variables = {
    GEMINI_API_KEY = var.gemini_api_key
  }

  # Use the existing service account for the function.
  service_account_email = var.existing_service_account_email
}

# Locals block to define the list of APIs to be enabled.
locals {
  apis = [
    "cloudfunctions.googleapis.com",
    "storage.googleapis.com",
    "vision.googleapis.com",
    "speech.googleapis.com",
    "firestore.googleapis.com",
    "iam.googleapis.com",
  ]
}
