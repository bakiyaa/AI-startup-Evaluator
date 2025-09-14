variable "gcp_project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region for the resources."
  type        = string
}

variable "gcp_bucket_name" {
  description = "The name of the Cloud Storage bucket."
  type        = string
  default     = "ai-starter-evaluation-bucket-9pguwa"
}

variable "gemini_api_key" {
  description = "The API key for the Gemini API."
  type        = string
  sensitive   = true
}

variable "existing_service_account_email" {
  description = "The email of the existing service account to be used by the Cloud Function."
  type        = string
}

variable "vertex_ai_index_name" {
  description = "The display name of the Vertex AI Index."
  type        = string
  default     = "deal-notes-index"
}

variable "vertex_ai_index_endpoint_name" {
  description = "The display name of the Vertex AI Index Endpoint."
  type        = string
  default     = "deal-notes-index-endpoint"
}

variable "http_function_name" {
  description = "The name of the HTTP-triggered Cloud Function."
  type        = string
  default     = "vectorize-deal-note"
}

variable "bigquery_dataset_id" {
  description = "The ID of the BigQuery dataset."
  type        = string
  default     = "startup_kpis"
}

variable "bigquery_table_id" {
  description = "The ID of the BigQuery table."
  type        = string
  default     = "kpi_data"
}

variable "public_data_table_id" {
  description = "The ID of the BigQuery table for public data."
  type        = string
  default     = "public_data"
}

variable "cloud_run_service_name" {
  description = "The name of the Cloud Run service."
  type        = string
  default     = "mcp-server"
}