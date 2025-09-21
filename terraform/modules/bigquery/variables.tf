variable "project_id" {
  description = "The ID of the Google Cloud project."
  type        = string
}

variable "env" {
  description = "The environment name (e.g., dev, prod)."
  type        = string
  default     = "dev"
}
