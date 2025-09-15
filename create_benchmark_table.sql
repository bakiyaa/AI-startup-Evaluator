CREATE OR REPLACE TABLE startup_kpis.benchmarking_data AS
SELECT
  name AS startup_name,
  ` market ` AS industry,
  category_list,
  country_code,
  founded_at,
  funding_rounds,
  status,
  seed,
  venture,
  round_A,
  round_B,
  round_C,
  round_D,
  round_E,
  round_F,
  round_G,
  round_H
FROM
  startup_kpis.investments_vc