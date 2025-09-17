variable "project_id" {
  description = "The Google Cloud project ID."
  type        = string
  default     = "digital-shadow-417907"
}

variable "region" {
  description = "The Google Cloud region for resources."
  type        = string
  default     = "us-central1"
}

variable "bucket_name" {
  description = "The name of the existing Cloud Storage bucket for uploads."
  type        = string
  default     = "ai-starter-evaluation-bucket-9pguwa"
}

variable "service_account_email" {
  description = "The email of the existing service account to run the functions and workflow."
  type        = string
  default     = "gemini-startup-evaluator@digital-shadow-417907.iam.gserviceaccount.com"
}
