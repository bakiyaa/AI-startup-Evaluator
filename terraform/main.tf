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
    "aiplatform.googleapis.com"
  ])

  service = each.key
  disable_on_destroy = false
}
# 1. The Pub/Sub topic for downstream notifications
resource "google_pubsub_topic" "new_document_topic" {
  name = "new-document-ready"
  depends_on = [google_project_service.enable_apis]
}

# 2. The three Cloud Functions managed by Terraform
resource "google_cloudfunctions2_function" "generate_signed_url" {
  project  = var.project_id
  name     = "generate-signed-url"
  location = var.region

  build_config {
    runtime     = "nodejs18"
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
  depends_on = [google_project_service.enable_apis]
}

resource "google_cloudfunctions2_function" "process_document" {
  project  = var.project_id
  name     = "process-document"
  location = var.region

  build_config {
    runtime     = "nodejs18"
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
  depends_on = [google_project_service.enable_apis]
}

resource "google_cloudfunctions2_function" "vectorize_deal_note" {
  project  = var.project_id
  name     = "vectorize-deal-note"
  location = var.region

  build_config {
    runtime     = "nodejs18"
    entry_point = "vectorizeDealNote"
    source {
      storage_source {
        bucket = "digital-shadow-function-source"
        object = "vectorize-deal-note.zip"
      }
    }
  }

  service_config {
    service_account_email = var.service_account_email
    all_traffic_on_latest_revision = true
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
      - init:
          assign: 
            - file_info: $${json.decode(base64.decode(event.data.message.data))}
            - project_id: "${var.project_id}"
            - firestore_collection: "processed_documents"
      - call_extract_text:
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
            result: extracted_text_response
          except:
            as: e
            raise: e
      - assign_extracted_text:
          assign: 
            - extracted_text: $${extracted_text_response.body}
      - call_vectorize_text:
          try:
            call: http.post
            args:
              url: ${google_cloudfunctions2_function.vectorize_deal_note.service_config[0].uri}
              auth:
                type: OIDC
              body:
                text: $${extracted_text}
            result: vector_embedding_response
          except:
            as: e
            raise: e
      - assign_vector_embedding:
          assign: 
            - vector_embedding: $${vector_embedding_response.body}
      - prepare_for_firestore:
          assign:
            - firestore_embedding: []
      - iterate_over_embedding:
          for:
            value: v
            in: $${vector_embedding}
            steps:
              - create_double_value_object:
                  assign:
                    - double_value_object:
                        doubleValue: $${v}
              - add_to_firestore_embedding:
                  assign:
                    - firestore_embedding: $${list.concat(firestore_embedding, [double_value_object])}
      - store_in_firestore:
          call: googleapis.firestore.v1.projects.databases.documents.createDocument
          args:
            parent: "projects/$${project_id}/databases/(default)/documents"
            collectionId: $${firestore_collection}
            body:
              fields:
                fileName:
                  stringValue: $${file_info.name}
                extractedText:
                  stringValue: $${extracted_text}
                embedding:
                  arrayValue:
                    values: $${firestore_embedding}
                timestamp:
                  timestampValue: $${time.format(sys.now())}
          result: firestore_document
      - publish_notification:
          call: googleapis.pubsub.v1.projects.topics.publish
          args:
            topic: "projects/$${project_id}/topics/${google_pubsub_topic.new_document_topic.name}"
            body:
              messages:
                - attributes:
                    documentId: $${firestore_document.name}
      - final_step:
          return: "Pipeline finished successfully"
  EOT

  depends_on = [
    google_project_service.enable_apis,
    google_pubsub_topic.new_document_topic,
    google_cloudfunctions2_function.process_document,
    google_cloudfunctions2_function.vectorize_deal_note
  ]
}

# 4. The Eventarc trigger to connect the bucket to the workflow
resource "google_eventarc_trigger" "mcp_trigger" {
  name            = "mcp-pipeline-trigger"
  location        = var.region
  project         = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = var.bucket_name
  }

  destination {
    workflow = google_workflows_workflow.mcp_pipeline.id
  }

  service_account = var.service_account_email
  depends_on = [google_project_service.enable_apis]
}

# 5. IAM bindings to allow invocation
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

resource "google_cloud_run_service_iam_member" "allow_workflow_to_invoke_vectorize_deal_note" {
  location = google_cloudfunctions2_function.vectorize_deal_note.location
  service  = google_cloudfunctions2_function.vectorize_deal_note.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.service_account_email}"
  depends_on = [google_project_service.enable_apis, google_cloudfunctions2_function.vectorize_deal_note]
}

resource "google_storage_bucket_iam_member" "allow_eventarc_to_read_bucket" {
  bucket = var.bucket_name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.service_account_email}"
}

resource "google_project_iam_member" "allow_gcs_to_publish_to_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-617213468863@gs-project-accounts.iam.gserviceaccount.com"
}