# Terraform configuration to set up the required providers.
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.10"
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

# Resource to create a Google Cloud Storage bucket.
# resource "google_storage_bucket" "bucket" {
#   name          = var.gcp_bucket_name
#   location      = var.gcp_region
#   force_destroy = true
#
#   uniform_bucket_level_access = true
# }

# Data source to create a zip archive of the Cloud Function source code.
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "../functions"
  output_path = "/tmp/functions.zip"
}

# Resource to upload the zip archive to the Cloud Storage bucket.
resource "google_storage_bucket_object" "archive" {
  name   = "functions.zip"
  bucket = var.gcp_bucket_name
  source = data.archive_file.source.output_path
}

# Resource to create the Google Cloud Function.
# resource "google_cloudfunctions_function" "function" {
#   name        = "process-document"
#   description = "Processes uploaded documents."
#   runtime     = "nodejs20"
#
#   available_memory_mb   = 256
#   source_archive_bucket = var.gcp_bucket_name
#   source_archive_object = google_storage_bucket_object.archive.name
#   entry_point           = "process-document"
#
#   # Trigger the function when a new object is created in the Cloud Storage bucket.
#   event_trigger {
#     event_type = "google.storage.object.finalize"
#     resource   = var.gcp_bucket_name
#   }
#
#   # Pass the Gemini API key as an environment variable to the function.
#   environment_variables = {
#     GEMINI_API_KEY = var.gemini_api_key
#   }
#
#   # Use the existing service account for the function.
#   service_account_email = var.existing_service_account_email
# }

# Resource to create the HTTP-triggered Google Cloud Function.
# resource "google_cloudfunctions_function" "http_function" {
#   name        = var.http_function_name
#   description = "Triggers on-demand vectorization."
#   runtime     = "nodejs18"
#
#   available_memory_mb   = 256
#   source_archive_bucket = var.gcp_bucket_name
#   source_archive_object = google_storage_bucket_object.archive.name
#   entry_point           = "vectorize-deal-note"
#
#   trigger_http = true
#
#   # Pass environment variables to the function.
#   environment_variables = {
#     GEMINI_API_KEY    = var.gemini_api_key
#     PROJECT_ID        = var.gcp_project_id
#     LOCATION          = var.gcp_region
#     INDEX_ENDPOINT_ID = var.vertex_ai_index_endpoint_name
#   }
#
#   # Use the existing service account for the function.
#   service_account_email = var.existing_service_account_email
# }

# resource "google_cloudfunctions_function_iam_member" "invoker" {
#   project        = google_cloudfunctions_function.http_function.project
#   region         = google_cloudfunctions_function.http_function.region
#   cloud_function = google_cloudfunctions_function.http_function.name
#   role           = "roles/cloudfunctions.invoker"
#   member         = "allUsers"
# }

# Resource to create a Vertex AI Index.
# resource "google_vertex_ai_index" "deal_notes_index" {
#   display_name = "Startup Deal Notes Index"
#   description  = "Index for startup deal notes"
#   region       = var.gcp_region
#
#   metadata {
#     contents_delta_uri = "gs://${var.gcp_bucket_name}/deal-notes-vectors"
#     config {
#       dimensions = 768 # Dimensions of the text-embedding-gecko@003 model
#       approximate_neighbors_count = 150
#       distance_measure_type = "DOT_PRODUCT_DISTANCE"
#       feature_norm_type = "NONE"
#       algorithm_config {
#         tree_ah_config {
#           leaf_node_embedding_count = 5000
#           leaf_nodes_to_search_percent = 8
#         }
#       }
#     }
#   }
# }

# Resource to create a Vertex AI Index Endpoint.
# resource "google_vertex_ai_index_endpoint" "deal_notes_index_endpoint" {
#   display_name = "Startup Deal Notes Index Endpoint"
#   region       = var.gcp_region
#
#   provisioner "local-exec" {
#     command = "gcloud ai index-endpoints deploy-index ${self.id} --index=${google_vertex_ai_index.deal_notes_index.id} --deployed-index-id=deal_notes_deployment --display-name=deal_notes_deployment"
#   }
# }

# Resource to create a BigQuery dataset.
# resource "google_bigquery_dataset" "kpi_dataset" {
#   dataset_id = var.bigquery_dataset_id
#   location   = var.gcp_region
# }

# Resource to create a BigQuery table.
# resource "google_bigquery_table" "kpi_table" {
#   dataset_id = var.bigquery_dataset_id
#   table_id   = var.bigquery_table_id
#
#   schema = <<EOF
# [
#   {
#     "name": "startup_id",
#     "type": "STRING",
#     "mode": "REQUIRED"
#   },
#   {
#     "name": "kpi_name",
#     "type": "STRING",
#     "mode": "REQUIRED"
#   },
#   {
#     "name": "kpi_value",
#     "type": "FLOAT64",
#     "mode": "REQUIRED"
#   },
#   {
#     "name": "date",
#     "type": "DATE",
#     "mode": "REQUIRED"
#   }
# ]
# EOF
# }

# Resource to create a Cloud Run service.
# resource "google_cloud_run_v2_service" "mcp_server" {
#   name     = var.cloud_run_service_name
#   location = var.gcp_region
#
#   template {
#     containers {
#       image = "gcr.io/${var.gcp_project_id}/${var.cloud_run_service_name}"
#     }
#   }
# }