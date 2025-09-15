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

# Resource to create a Google Cloud Storage bucket for founder materials.
resource "google_storage_bucket" "founder_materials" {
  name          = var.gcp_bucket_name
  location      = var.gcp_region
  force_destroy = true # Not recommended for production

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }
}

# Resource to create a Google Cloud Storage bucket for Cloud Function sources.
resource "google_storage_bucket" "function_sources_bucket" {
  name          = "${var.gcp_project_id}-function-sources" # Unique name
  location      = var.gcp_region
  force_destroy = true # Not recommended for production

  uniform_bucket_level_access = true
}

# Data source to create a zip archive of the Cloud Function source code.
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "../functions"
  output_path = "/tmp/functions.zip"
}

# Resource to upload the zip archive to the functions source bucket.
resource "google_storage_bucket_object" "archive" {
  name   = "functions.zip"
  bucket = google_storage_bucket.function_sources_bucket.name
  source = data.archive_file.source.output_path
}

# Resource to create the document processing Google Cloud Function.
resource "google_cloudfunctions_function" "process_document_function" {
  name        = "process-document"
  description = "Processes uploaded documents (PDFs, audio, video)."
  runtime     = "nodejs20"

  available_memory_mb   = 512 # Increased memory for video processing
  source_archive_bucket = google_storage_bucket_object.archive.bucket
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "process-document"

  # Trigger the function when a new object is created in the Cloud Storage bucket.
  event_trigger {
    event_type = "google.storage.object.finalize"
    resource   = "${var.gcp_project_id}.appspot.com"
  }

  # Pass environment variables to the function.
  environment_variables = {
    GEMINI_API_SECRET_NAME = google_secret_manager_secret.gemini_api_key_secret.secret_id
    GCP_PROJECT_ID = var.gcp_project_id
    BIGQUERY_DATASET_ID = var.bigquery_dataset_id
    BIGQUERY_PUBLIC_DATA_TABLE_ID = var.public_data_table_id
  }

  # Use the existing service account for the function.
  service_account_email = var.existing_service_account_email
}

# Resource to create the HTTP-triggered Google Cloud Function.
resource "google_cloudfunctions_function" "http_function" {
  name        = var.http_function_name
  description = "Triggers on-demand vectorization."
  runtime     = "nodejs18"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket_object.archive.bucket
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "vectorize-deal-note"

  trigger_http = true

  # Pass environment variables to the function.
  environment_variables = {
    GEMINI_API_SECRET_NAME = google_secret_manager_secret.gemini_api_key_secret.secret_id
    PROJECT_ID        = var.gcp_project_id
    LOCATION          = var.gcp_region
    INDEX_ENDPOINT_ID = var.vertex_ai_index_endpoint_name
  }

  # Use the existing service account for the function.
  service_account_email = var.existing_service_account_email
}

resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.http_function.project
  region         = google_cloudfunctions_function.http_function.region
  cloud_function = google_cloudfunctions_function.http_function.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

resource "google_vertex_ai_index" "deal_notes_index" {
  display_name = var.vertex_ai_index_name
  description  = "Index for startup deal notes"
  region       = var.gcp_region

  metadata {
    contents_delta_uri = "gs://${google_storage_bucket.founder_materials.name}/deal-notes-vectors"
    config {
      dimensions = 768 # Dimensions of the text-embedding-gecko@003 model
      approximate_neighbors_count = 150
      distance_measure_type = "DOT_PRODUCT_DISTANCE"
      feature_norm_type = "NONE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count = 5000
          leaf_nodes_to_search_percent = 8
        }
      }
    }
  }
}

# Resource to create a Vertex AI Index Endpoint.
resource "google_vertex_ai_index_endpoint" "deal_notes_index_endpoint" {
  display_name = var.vertex_ai_index_endpoint_name
  region       = var.gcp_region
}

# Resource to create a BigQuery dataset.
resource "google_bigquery_dataset" "kpi_dataset" {
  dataset_id = var.bigquery_dataset_id
  location   = var.gcp_region
}

# Resource to create a BigQuery table.
resource "google_bigquery_table" "kpi_table" {
  dataset_id = var.bigquery_dataset_id
  table_id   = var.bigquery_table_id

  schema = <<EOF
[
  {
    "name": "startup_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "kpi_name",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "kpi_value",
    "type": "FLOAT64",
    "mode": "REQUIRED"
  },
  {
    "name": "date",
    "type": "DATE",
    "mode": "REQUIRED"
  }
]
EOF
}

# Resource to create a BigQuery table for public data.
resource "google_bigquery_table" "public_data_table" {
  dataset_id = var.bigquery_dataset_id
  table_id   = var.public_data_table_id

  schema = <<EOF
[
  {
    "name": "startup_name",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "founder_market_fit_score",
    "type": "FLOAT64",
    "mode": "NULLABLE"
  },
  {
    "name": "founder_market_fit_justification",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "market_size_estimate",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "market_size_source",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "differentiation_summary",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "differentiation_ip",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "traction_signals",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "traction_benchmarks",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "financials_estimates",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "financials_comparisons",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "risk_flags",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "risk_sources",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "recommendation_summary",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "recommendation_score",
    "type": "FLOAT64",
    "mode": "NULLABLE"
  },
  {
    "name": "urls",
    "type": "STRING",
    "mode": "REPEATED"
  }
]
EOF
}

# Resource to create a Firestore database.
resource "google_firestore_database" "database" {
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = var.gcp_region
  type        = "FIRESTORE_NATIVE"
}

# Resource to create a Secret Manager secret for the Gemini API Key.
resource "google_secret_manager_secret" "gemini_api_key_secret" {
  project = var.gcp_project_id
  secret_id = "gemini-api-key"

  replication {
    auto {}
  }
}

# Resource to add a version to the Secret Manager secret.
resource "google_secret_manager_secret_version" "gemini_api_key_secret_version" {
  secret      = google_secret_manager_secret.gemini_api_key_secret.id
  secret_data = var.gemini_api_key
}

# Grant the Cloud Function service account permission to access the secret.
resource "google_secret_manager_secret_iam_member" "gemini_api_key_secret_access" {
  project   = google_secret_manager_secret.gemini_api_key_secret.project
  secret_id = google_secret_manager_secret.gemini_api_key_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.existing_service_account_email}"
}

# Resource to create the analyze-startup Google Cloud Function.
resource "google_cloudfunctions2_function" "analyze_startup" {
  name        = "analyze-startup-function"
  location    = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "analyze-startup-function"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    max_instance_count = 12
    available_memory   = "512M"
    timeout_seconds    = 60
    environment_variables = {
      GCP_PROJECT_ID = var.gcp_project_id
      GCP_REGION = var.gcp_region
    }
    ingress_settings = "ALLOW_ALL"
    service_account_email = var.existing_service_account_email
  }
}

# Resource to create the get-suggestions Google Cloud Function.
resource "google_cloudfunctions2_function" "get_suggestions" {
  name        = "get-suggestions"
  location    = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "get-suggestions"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    max_instance_count = 12
    available_memory   = "512M"
    timeout_seconds    = 60
    environment_variables = {
      LOG_EXECUTION_ID = "true"
    }
    ingress_settings = "ALLOW_ALL"
    service_account_email = "617213468863-compute@developer.gserviceaccount.com"
  }
}

# Resource to create the load-real-time-data Google Cloud Function.


# Resource to create the load-startup-data Google Cloud Function.
resource "google_cloudfunctions2_function" "load_startup_data" {
  name        = "load-startup-data"
  location    = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "load-startup-data"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    max_instance_count = 6
    available_memory   = "512M"
    timeout_seconds    = 60
    environment_variables = {
      LOG_EXECUTION_ID = "true"
    }
    ingress_settings = "ALLOW_ALL"
    service_account_email = "617213468863-compute@developer.gserviceaccount.com"
  }
}

resource "google_cloud_run_v2_service" "mcp_server" {
  name     = "mcp-server"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/digital-shadow-417907/mcp-server"
    }
    scaling {
      max_instance_count = 3
    }
  }
}

resource "google_cloudfunctions2_function" "get_public_data" {
  name     = "get-public-data"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "load-startup-data"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    service_account_email = "617213468863-compute@developer.gserviceaccount.com"
  }
}

resource "google_cloudfunctions2_function" "find_peer_group" {
  name        = "find-peer-group-function"
  location    = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "find-peer-group-function"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    max_instance_count = 3
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      BIGQUERY_DATASET = "startup_data"
      BIGQUERY_TABLE   = "investments"
    }
    service_account_email = var.existing_service_account_email
  }
}

resource "google_cloudfunctions2_function" "calculate_benchmarks" {
  name        = "calculate-benchmarks-function"
  location    = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "calculate-benchmarks-function"
    source {
      storage_source {
        bucket = google_storage_bucket_object.archive.bucket
        object = google_storage_bucket_object.archive.name
      }
    }
  }

  service_config {
    max_instance_count = 3
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      BIGQUERY_DATASET = "startup_data"
      BIGQUERY_TABLE   = "investments"
    }
    service_account_email = var.existing_service_account_email
  }
}


