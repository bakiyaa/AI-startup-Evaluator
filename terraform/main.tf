terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

resource "google_artifact_registry_repository" "mcp_toolbox_repo" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = "mcp-toolbox-repo"
  description   = "Repository for MCP Toolbox container images"
  format        = "DOCKER"
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
    "speech.googleapis.com",
    "videointelligence.googleapis.com",
    "alloydb.googleapis.com",
    "bigtable.googleapis.com"
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

  service_config {
    environment_variables = {
      ALLOYDB_INSTANCE_CONNECTION_NAME = format("projects/%s/locations/%s/clusters/%s/instances/%s", var.project_id, var.region, google_alloydb_cluster.default.cluster_id, google_alloydb_instance.default.instance_id)
      ALLOYDB_DB                       = "postgres"
      ALLOYDB_USER                     = "postgres"
    }
    secret_environment_variables {
      key        = "ALLOYDB_PASSWORD"
      secret     = data.google_secret_manager_secret.alloydb_password.secret_id
      version    = "latest"
      project_id = var.project_id
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
  depends_on = [google_project_service.enable_apis, google_alloydb_instance.default]
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
      - log_file_info:
          call: sys.log
          args:
            text: $${file_info}
            severity: INFO
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

resource "google_project_iam_member" "allow_eventarc_to_invoke_workflow" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = "serviceAccount:${var.service_account_email}"
 depends_on = [google_project_service.enable_apis]
}

resource "google_project_iam_member" "allow_workflow_to_update_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${var.service_account_email}"
 depends_on = [google_project_service.enable_apis]
}

resource "null_resource" "mcp_toolbox_build" {
  triggers = {
    # This will re-run the build every time the content of the mcp-toolbox directory changes
    dir_sha1 = sha1(join("", [for f in fileset("${path.module}/../mcp-toolbox", "**") : filesha1("${path.module}/../mcp-toolbox/${f}")]))
  }

  provisioner "local-exec" {
    command = "gcloud builds submit /home/bakiyapalani1997/AI-startup-Evaluator/mcp-toolbox --config /home/bakiyapalani1997/AI-startup-Evaluator/mcp-toolbox/cloudbuild.yaml --substitutions=_IMAGE_NAME=${google_artifact_registry_repository.mcp_toolbox_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.mcp_toolbox_repo.repository_id}/mcp-toolbox:latest"
  }
}

resource "google_cloud_run_v2_service" "mcp_toolbox_service" {
  provider = google-beta
  project  = var.project_id
  location = var.region
  name     = "mcp-toolbox-service"

  template {
    containers {
      image = "${google_artifact_registry_repository.mcp_toolbox_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.mcp_toolbox_repo.repository_id}/mcp-toolbox:latest"
    }
  }

  depends_on = [
    null_resource.mcp_toolbox_build
  ]
}

resource "google_alloydb_cluster" "default" {
  provider = google-beta
  project  = var.project_id
  location = var.region
  cluster_id = "alloydb-cluster"
  network_config {
    network = "default"
  }
  depends_on = [google_project_service.enable_apis]
}

resource "google_alloydb_instance" "default" {
  provider = google-beta
  cluster = google_alloydb_cluster.default.name
  instance_id = "alloydb-instance"
  instance_type = "PRIMARY"
  machine_config {
    cpu_count = 2
  }
  database_flags = {
    "alloydb.extensions" = "pgvector"
  }
}

data "google_secret_manager_secret" "alloydb_password" {
  provider  = google-beta
  project   = var.project_id
  secret_id = "alloydb-password"
}



resource "google_artifact_registry_repository" "rag_query_service_repo" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = "rag-query-service-repo"
  description   = "Repository for RAG Query Service container images"
  format        = "DOCKER"
}

resource "null_resource" "rag_query_service_build" {
  triggers = {
    # This will re-run the build every time the content of the rag-query-service directory changes
    dir_sha1 = sha1(join("", [for f in fileset("${path.module}/../rag-query-service", "**") : filesha1("${path.module}/../rag-query-service/${f}")]))
  }

  provisioner "local-exec" {
    command = "gcloud builds submit /home/bakiyapalani1997/AI-startup-Evaluator/rag-query-service --config /home/bakiyapalani1997/AI-startup-Evaluator/rag-query-service/cloudbuild.yaml --substitutions=_IMAGE_NAME=${google_artifact_registry_repository.rag_query_service_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_query_service_repo.repository_id}/rag-query-service:latest"
  }
}

resource "google_cloud_run_v2_service" "rag_query_service" {
  provider = google-beta
  project  = var.project_id
  location = var.region
  name     = "rag-query-service"

  template {
    service_account = var.service_account_email
    containers {
      image = "${google_artifact_registry_repository.rag_query_service_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_query_service_repo.repository_id}/rag-query-service:latest"
      env {
        name  = "ALLOYDB_INSTANCE_CONNECTION_NAME"
        value = format("projects/%s/locations/%s/clusters/%s/instances/%s", var.project_id, var.region, google_alloydb_cluster.default.cluster_id, google_alloydb_instance.default.instance_id)
      }
      env {
        name  = "ALLOYDB_DB"
        value = "postgres"
      }
      env {
        name  = "ALLOYDB_USER"
        value = "postgres"
      }
      env {
        name = "ALLOYDB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.alloydb_password.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "BIGTABLE_INSTANCE_ID"
        value = google_bigtable_instance.ai_evaluator_bigtable.name
      }
      env {
        name  = "BIGTABLE_TABLE_ID"
        value = google_bigtable_table.default.name
      }
      env {
        name  = "MCP_TOOLBOX_URL"
        value = google_cloud_run_v2_service.mcp_toolbox_service.uri
      }
      env {
        name  = "CONTEXT_MANAGEMENT_SERVICE_URL"
        value = google_cloudfunctions2_function.context_management_service.service_config[0].uri
      }
    }
  }

  depends_on = [
    null_resource.rag_query_service_build,
    google_bigtable_table.default,
    google_cloud_run_v2_service.mcp_toolbox_service
  ]
}

data "google_secret_manager_secret" "gemini_api_key" {
  provider  = google-beta
  project   = var.project_id
  secret_id = "gemini-api-key"
}



resource "google_bigtable_instance" "ai_evaluator_bigtable" {
  provider = google-beta
  name     = "ai-evaluator-bigtable"
  project  = var.project_id
  cluster {
    cluster_id   = "ai-evaluator-bigtable-cluster"
    zone         = "us-central1-b"
    num_nodes    = 1
    storage_type = "SSD"
  }
}

resource "google_bigtable_table" "default" {
  provider      = google-beta
  name          = "table1"
  instance_name = google_bigtable_instance.ai_evaluator_bigtable.name
  project       = var.project_id
  column_family {
    family = "company_info"
  }
}

module "bigquery" {
  source      = "./modules/bigquery"
  project_id  = var.project_id
  env         = var.env
}

resource "google_cloudfunctions2_function" "context_management_service" {
  project  = var.project_id
  name     = "context-management-service"
  location = var.region

  build_config {
    runtime     = "python310"
    entry_point = "agent_query"
    source {
      storage_source {
        bucket = "digital-shadow-function-source"
        object = "context-management-service.zip"
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

resource "google_cloud_run_service_iam_member" "allow_rag_query_to_invoke_context_management" {
  location = google_cloudfunctions2_function.context_management_service.location
  service  = google_cloudfunctions2_function.context_management_service.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.service_account_email}"
  depends_on = [google_project_service.enable_apis, google_cloudfunctions2_function.context_management_service]
}

output "rag_query_service_uri" {
  description = "The URI of the RAG Query Service."
  value       = google_cloud_run_v2_service.rag_query_service.uri
}