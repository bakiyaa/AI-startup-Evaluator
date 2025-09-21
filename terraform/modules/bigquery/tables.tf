resource "google_bigquery_dataset" "datasets" {
  provider    = google-beta
  for_each    = toset(["founder_materials", "public_signals", "finance", "benchmarks", "risk"])
  project     = var.project_id
  dataset_id  = each.key
  location    = "US"
  description = "Dataset for ${each.key}"
}

resource "google_bigquery_table" "startups" {
  provider    = google-beta
  project     = var.project_id
  dataset_id  = "public_signals"
  table_id    = "startups"
  description = "Master entity for startups"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = var.env != null ? var.env : "dev"
  }

  schema = <<EOF
[
  {"name":"startup_id","type":"STRING","mode":"REQUIRED","description":"Primary key"},
  {"name":"legal_name","type":"STRING","mode":"NULLABLE"},
  {"name":"aka_names","type":"STRING","mode":"REPEATED"},
  {"name":"domain","type":"STRING","mode":"NULLABLE"},
  {"name":"sector","type":"STRING","mode":"NULLABLE"},
  {"name":"stage","type":"STRING","mode":"NULLABLE"},
  {"name":"country","type":"STRING","mode":"NULLABLE"},
  {"name":"linkedin_url","type":"STRING","mode":"NULLABLE"},
  {"name":"twitter_url","type":"STRING","mode":"NULLABLE"},
  {"name":"youtube_url","type":"STRING","mode":"NULLABLE"},
  {"name":"appstore_app_id","type":"STRING","mode":"NULLABLE"},
  {"name":"playstore_app_id","type":"STRING","mode":"NULLABLE"},
  {"name":"edgar_cik","type":"STRING","mode":"NULLABLE"},
  {"name":"companies_house_number","type":"STRING","mode":"NULLABLE"},
  {"name":"created_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"},
  {"name":"updated_at","type":"TIMESTAMP","mode":"NULLABLE"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  require_partition_filter = true
  depends_on = [google_bigquery_dataset.datasets["public_signals"]]
}

resource "google_bigquery_table" "events_news" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "public_signals"
  table_id            = "events_news"
  description         = "Normalized news/events (e.g., from GDELT), including tone and entities"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"event_id","type":"STRING","mode":"REQUIRED","description":"Natural key (sourceKey:date:url)"},
  {"name":"startup_id","type":"STRING","mode":"NULLABLE"},
  {"name":"event_ts","type":"TIMESTAMP","mode":"NULLABLE"},
  {"name":"source_domain","type":"STRING","mode":"NULLABLE"},
  {"name":"headline","type":"STRING","mode":"NULLABLE"},
  {"name":"url","type":"STRING","mode":"NULLABLE"},
  {"name":"lang","type":"STRING","mode":"NULLABLE"},
  {"name":"tone","type":"FLOAT","mode":"NULLABLE"},
  {"name":"persons","type":"STRING","mode":"REPEATED"},
  {"name":"organizations","type":"STRING","mode":"REPEATED"},
  {"name":"locations","type":"STRING","mode":"REPEATED"},
  {"name":"raw","type":"JSON","mode":"NULLABLE"},
  {"name":"ingested_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "event_ts"
  }

  require_partition_filter = true
  clustering               = ["source_domain", "startup_id"]
}

resource "google_bigquery_table" "social_posts" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "public_signals"
  table_id            = "social_posts"
  description         = "Normalized social posts across LinkedIn, X/Twitter, YouTube"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"post_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"NULLABLE"},
  {"name":"network","type":"STRING","mode":"NULLABLE"},
  {"name":"author","type":"STRING","mode":"NULLABLE"},
  {"name":"post_ts","type":"TIMESTAMP","mode":"NULLABLE"},
  {"name":"text","type":"STRING","mode":"NULLABLE"},
  {"name":"url","type":"STRING","mode":"NULLABLE"},
  {"name":"like_count","type":"INT64","mode":"NULLABLE"},
  {"name":"comment_count","type":"INT64","mode":"NULLABLE"},
  {"name":"share_count","type":"INT64","mode":"NULLABLE"},
  {"name":"view_count","type":"INT64","mode":"NULLABLE"},
  {"name":"raw","type":"JSON","mode":"NULLABLE"},
  {"name":"ingested_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "post_ts"
  }

  require_partition_filter = true
  clustering               = ["network", "startup_id"]
}

resource "google_bigquery_table" "app_reviews" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "public_signals"
  table_id            = "app_reviews"
  description         = "App reviews from Apple App Store Connect and Google Play Developer APIs"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"review_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"NULLABLE"},
  {"name":"store","type":"STRING","mode":"NULLABLE"},
  {"name":"country","type":"STRING","mode":"NULLABLE"},
  {"name":"rating","type":"INT64","mode":"NULLABLE"},
  {"name":"title","type":"STRING","mode":"NULLABLE"},
  {"name":"body","type":"STRING","mode":"NULLABLE"},
  {"name":"reviewer","type":"STRING","mode":"NULLABLE"},
  {"name":"review_ts","type":"TIMESTAMP","mode":"NULLABLE"},
  {"name":"raw","type":"JSON","mode":"NULLABLE"},
  {"name":"ingested_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "review_ts"
  }

  require_partition_filter = true
  clustering               = ["store", "country", "startup_id"]
}

resource "google_bigquery_table" "company_profiles_external" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "public_signals"
  table_id            = "company_profiles_external"
  description         = "External registry profiles (EDGAR, Companies House) and recent filings"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"source","type":"STRING","mode":"REQUIRED"},
  {"name":"company_key","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"NULLABLE"},
  {"name":"profile","type":"JSON","mode":"NULLABLE"},
  {"name":"filings","type":"JSON","mode":"REPEATED"},
  {"name":"updated_at","type":"TIMESTAMP","mode":"NULLABLE"},
  {"name":"ingested_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "updated_at"
  }

  require_partition_filter = true
  clustering               = ["source", "startup_id"]
}

resource "google_bigquery_table" "documents" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "founder_materials"
  table_id            = "documents"
  description         = "Founder-provided documents (pitch decks, PDFs) and OCR/parsed references"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"doc_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"source","type":"STRING","mode":"NULLABLE"},
  {"name":"storage_uri","type":"STRING","mode":"NULLABLE"},
  {"name":"doc_type","type":"STRING","mode":"NULLABLE"},
  {"name":"parsed_text","type":"STRING","mode":"NULLABLE"},
  {"name":"tokens_estimate","type":"INT64","mode":"NULLABLE"},
  {"name":"embedding_ref","type":"STRING","mode":"NULLABLE"},
  {"name":"created_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"},
  {"name":"updated_at","type":"TIMESTAMP","mode":"NULLABLE"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  require_partition_filter = true
  clustering               = ["startup_id", "doc_type"]
}

resource "google_bigquery_table" "transcripts" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "founder_materials"
  table_id            = "transcripts"
  description         = "Call transcripts (Speech-to-Text v2) incl. diarization metadata"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"transcript_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"call_ts","type":"TIMESTAMP","mode":"NULLABLE"},
  {"name":"language_code","type":"STRING","mode":"NULLABLE"},
  {"name":"duration_seconds","type":"INT64","mode":"NULLABLE"},
  {"name":"speaker_count","type":"INT64","mode":"NULLABLE"},
  {"name":"transcript","type":"STRING","mode":"NULLABLE"},
  {"name":"diarization","type":"JSON","mode":"NULLABLE"},
  {"name":"created_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "call_ts"
  }

  require_partition_filter = true
  clustering               = ["startup_id", "language_code"]
}

resource "google_bigquery_table" "financials_invoices" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "finance"
  table_id            = "financials_invoices"
  description         = "Invoices/ARR-MRR ledger used for NRR, Quick Ratio, Magic Number"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"invoice_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"customer_id","type":"STRING","mode":"NULLABLE"},
  {"name":"product","type":"STRING","mode":"NULLABLE"},
  {"name":"amount","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"currency","type":"STRING","mode":"NULLABLE"},
  {"name":"mrr_delta","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"arr_delta","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"type","type":"STRING","mode":"NULLABLE"},
  {"name":"invoice_date","type":"DATE","mode":"NULLABLE"},
  {"name":"created_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "invoice_date"
  }

  require_partition_filter = true
  clustering               = ["startup_id", "customer_id"]
}

resource "google_bigquery_table" "sales_marketing_spend" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "finance"
  table_id            = "sales_marketing_spend"
  description         = "Quarterly Sales & Marketing spend for Magic Number calculations"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"qtr","type":"DATE","mode":"REQUIRED"},
  {"name":"amount","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"created_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "qtr"
  }

  require_partition_filter = true
  clustering               = ["startup_id"]
}

resource "google_bigquery_table" "metrics_timeseries" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "finance"
  table_id            = "metrics_timeseries"
  description         = "Derived metrics (NRR, GRR, Magic Number, Quick Ratio, CAC Payback...)"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"metric_name","type":"STRING","mode":"REQUIRED"},
  {"name":"ts","type":"TIMESTAMP","mode":"REQUIRED"},
  {"name":"value","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"inputs_ref","type":"STRING","mode":"NULLABLE"},
  {"name":"computed_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "ts"
  }

  require_partition_filter = true
  clustering               = ["metric_name", "startup_id"]
}

resource "google_bigquery_table" "benchmarks_reference" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "benchmarks"
  table_id            = "benchmarks_reference"
  description         = "Benchmark bands by metric, stage, sector and source"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"metric_name","type":"STRING","mode":"REQUIRED"},
  {"name":"stage","type":"STRING","mode":"NULLABLE"},
  {"name":"sector","type":"STRING","mode":"NULLABLE"},
  {"name":"source","type":"STRING","mode":"NULLABLE"},
  {"name":"band","type":"STRING","mode":"NULLABLE"},
  {"name":"value_from","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"value_to","type":"NUMERIC","mode":"NULLABLE"},
  {"name":"notes","type":"STRING","mode":"NULLABLE"},
  {"name":"updated_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "updated_at"
  }

  require_partition_filter = true
  clustering               = ["metric_name", "stage", "sector"]
}

resource "google_bigquery_table" "risk_flags" {
  provider            = google-beta
  project             = var.project_id
  dataset_id          = "risk"
  table_id            = "risk_flags"
  description         = "Risk detections with evidence links and severity"
  deletion_protection = false

  labels = {
    domain = "ai-analyst"
    env    = try(var.env, "dev")
  }

  schema = <<EOF
[
  {"name":"flag_id","type":"STRING","mode":"REQUIRED"},
  {"name":"startup_id","type":"STRING","mode":"REQUIRED"},
  {"name":"rule_id","type":"STRING","mode":"NULLABLE"},
  {"name":"severity","type":"STRING","mode":"NULLABLE"},
  {"name":"message","type":"STRING","mode":"NULLABLE"},
  {"name":"evidence_url","type":"STRING","mode":"NULLABLE"},
  {"name":"detected_at","type":"TIMESTAMP","mode":"REQUIRED"},
  {"name":"ingested_at","type":"TIMESTAMP","mode":"NULLABLE","defaultValueExpression":"CURRENT_TIMESTAMP()"}
]
EOF

  time_partitioning {
    type  = "DAY"
    field = "detected_at"
  }

  require_partition_filter = true
  clustering               = ["startup_id", "severity"]
}