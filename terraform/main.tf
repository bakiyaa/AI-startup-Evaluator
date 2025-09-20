terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 0. Enable all necessary APIs
resource "google_project_service" "enable_apis" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "workflows.googleapis.com",
    "eventarc.googleapis.com",
    "run.googleapis.com",
    "iam.googleapis.com",
    "firestore.googleapis.com",
    "pubsub.googleapis.com",
    "aiplatform.googleapis.com",
    "speech.googleapis.com"
  ])

  service = each.key
  disable_on_destroy = false
}

resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  depends_on = [google_project_service.enable_apis]
}

resource "google_pubsub_topic" "data_ingestion_topic" {
  project = var.project_id
  name    = "dataingestionTopic"
  depends_on = [google_project_service.enable_apis]
}

# 1. The Pub/Sub topic for downstream notifications
resource "google_pubsub_topic" "new_document_topic" {
  name = "DownStreamAnalysis"
  depends_on = [google_project_service.enable_apis]
}

# 2. The three Cloud Functions managed by Terraform
resource "google_cloudfunctions2_function" "generate_signed_url" {
  project  = var.project_id
  name     = "generate-signed-url"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "generateSignedUrl"
    source {
      storage_source {
        bucket = "digital-shadow-function-source"
        object = "generate-signed-url.zip"
      }
    }
  }

  service_config {
    service_account_email = var.service_account_email
    all_traffic_on_latest_revision = true
    environment_variables = {
      BUCKET_NAME = var.bucket_name
    }
  }
  labels = {
    "redeployment-timestamp" = formatdate("YYYYMMDDhhmmss", timestamp())
  }
  depends_on = [google_project_service.enable_apis]
}

resource "google_cloudfunctions2_function" "process_document" {
  project  = var.project_id
  name     = "process-document"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "processDocument"
    source {
      storage_source {
        bucket = "digital-shadow-function-source"
        object = "process-document.zip"
      }
    }
  }

  service_config {
    service_account_email = var.service_account_email
    all_traffic_on_latest_revision = true
  }
  labels = {
    "redeployment-timestamp" = formatdate("YYYYMMDDhhmmss", timestamp())
  }
  depends_on = [google_project_service.enable_apis]
}

resource "google_cloudfunctions2_function" "vectorize_deal_note" {
  project  = var.project_id
  name     = "vectorize-deal-note"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "vectorizeDealNote"
    source {
      storage_source {
        bucket = "digital-shadow-function-source"
        object = "vectorize-deal-note.zip"
      }
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.firestore.document.v1.written"
    event_filters {
      attribute = "database"
      value     = "(default)"
    }
    event_filters {
      attribute = "namespace"
      value     = "(default)"
    }
    event_filters {
      attribute = "document"
      value     = "projects/{projectId}/files/{fileId}"
    }
  }

  labels = {
    "redeployment-timestamp" = formatdate("YYYYMMDDhhmmss", timestamp())
  }
  depends_on = [google_project_service.enable_apis]
}

# 3. The main orchestration workflow
resource "google_workflows_workflow" "mcp_pipeline" {
  name            = "mcp-pipeline"
  description     = "Main workflow to process uploaded documents."
  service_account = var.service_account_email

  source_contents = <<-EOT
main:
    params: [event]
    steps:
      - decode_pubsub_message:
          assign:
            - file_info: $${json.decode(base64.decode(event.data.message.data))}
      - call_process_document:
          try:
            call: http.post
            args:
              url: ${google_cloudfunctions2_function.process_document.service_config[0].uri}
              auth:
                type: OIDC
              body:
                bucketName: $${file_info.bucket}
                fileName: $${file_info.name}
                contentType: $${file_info.contentType}
            result: call_response
          except:
            as: e
            raise: e
      - return_success:
          return: "Workflow successfully triggered process-document function."
  EOT

  depends_on = [
    google_project_service.enable_apis,
    google_cloudfunctions2_function.process_document,
    google_firestore_database.database
  ]
}

# 4. GCS notification to send events to Pub/Sub
resource "google_storage_notification" "gcs_notification" {
  bucket         = var.bucket_name
  topic          = google_pubsub_topic.data_ingestion_topic.id
  payload_format = "JSON_API_V1"
  event_types    = ["OBJECT_FINALIZE"]
  depends_on     = [google_pubsub_topic.data_ingestion_topic]
}

# 5. The Eventarc trigger to connect the Pub/Sub topic to the workflow
resource "google_eventarc_trigger" "mcp_trigger" {
  name            = "mcp-pipeline-trigger"
  location        = var.region
  project         = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.pubsub.topic.v1.messagePublished"
  }

  destination {
    workflow = google_workflows_workflow.mcp_pipeline.id
  }

  transport {
    pubsub {
      topic = google_pubsub_topic.data_ingestion_topic.id
    }
  }

  service_account = var.service_account_email
  depends_on = [google_project_service.enable_apis]
}
data "google_storage_project_service_account" "gcs_account" {
  project = var.project_id
}

# 6. IAM bindings to allow invocation
resource "google_cloud_run_service_iam_member" "make_public" {
  location = google_cloudfunctions2_function.generate_signed_url.location
  service  = google_cloudfunctions2_function.generate_signed_url.name
  role     = "roles/run.invoker"
  member   = "allUsers"
  depends_on = [google_project_service.enable_apis]
}
resource "google_cloud_run_service_iam_member" "allow_workflow_to_invoke_process_document" {
  location = google_cloudfunctions2_function.process_document.location
  service  = google_cloudfunctions2_function.process_document.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.service_account_email}"
  depends_on = [google_project_service.enable_apis, google_cloudfunctions2_function.process_document]
}
resource "google_storage_bucket_iam_member" "allow_eventarc_to_read_bucket" {
  bucket = var.bucket_name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.service_account_email}"
}
resource "google_pubsub_topic_iam_member" "gcs_pubsub_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.data_ingestion_topic.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}
resource "google_service_account_iam_member" "allow_self_to_sign_blobs" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.service_account_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${var.service_account_email}"
}

resource "google_project_iam_member" "allow_workflow_to_write_to_firestore" {
  project = var.project_id
  role    = "roles/datastore.owner"
  member  = "serviceAccount:${var.service_account_email}"
}