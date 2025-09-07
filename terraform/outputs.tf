# output "bucket_name" {
#   description = "The name of the Cloud Storage bucket."
#   value       = google_storage_bucket.bucket.name
# }

output "service_account_email" {
  description = "The email of the service account."
  value       = var.existing_service_account_email
}

# output "vertex_ai_index_id" {
#   description = "The ID of the Vertex AI Index."
#   value       = google_vertex_ai_index.deal_notes_index.id
# }

# output "vertex_ai_index_endpoint_id" {
#   description = "The ID of the Vertex AI Index Endpoint."
#   value       = google_vertex_ai_index_endpoint.deal_notes_index_endpoint.id
# }

# output "bigquery_dataset_id" {
#   description = "The ID of the BigQuery dataset."
#   value       = google_bigquery_dataset.kpi_dataset.dataset_id
# }

# output "bigquery_table_id" {
#   description = "The ID of the BigQuery table."
#   value       = google_bigquery_table.kpi_table.table_id
# }

output "cloud__run_service_url" {
  description = "The URL of the Cloud Run service."
  value       = google_cloud_run_v2_service.mcp_server.uri
}

output "http_function_url" {
  description = "The URL of the HTTP Cloud Function."
  value       = google_cloudfunctions_function.http_function.https_trigger_url
}