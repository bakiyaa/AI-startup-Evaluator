variable "gcp_project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region."
  type        = string
}

variable "gcp_bucket_name" {
  description = "The name of the Cloud Storage bucket."
  type        = string
}

variable "existing_service_account_email" {
  description = "The email of the existing service account to use."
  type        = string
}

variable "gemini_api_key" {
  description = "The API key for the Gemini API."
  type        = string
  sensitive   = true
}
