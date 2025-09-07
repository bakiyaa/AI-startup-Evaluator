output "bucket_name" {
  description = "The name of the Cloud Storage bucket."
  value       = google_storage_bucket.bucket.name
}

output "service_account_email" {
  description = "The email of the service account."
  value       = var.existing_service_account_email
}
