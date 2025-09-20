const functions = require("firebase-functions");
const { Bigtable } = require("@google-cloud/bigtable");
const { v4: uuidv4 } = require("uuid");
const { parse } = require("csv-parse");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execPromise = util.promisify(exec);

// --- Configuration ---
// In a real application, move these to environment variables
const KAGGLE_DATASET_ID = "ronakjshah/startup-investments";
const BIGTABLE_INSTANCE_ID = "ai-evaluator-bigtable";
const BIGTABLE_TABLE_ID = "table1";
const COLUMN_FAMILY_ID = "investment_details";
const BATCH_SIZE = 500; // Number of rows to write to Bigtable at a time

// Columns from the CSV to map to Bigtable
const MAPPED_COLUMNS = [
  "name", "homepage_url", "category_list", "funding_total_usd", 
  "status", "country_code", "state_code", "region", "city", "founded_at"
];


/**
 * Main logic to download data from Kaggle, parse it, and upload to Bigtable.
 */
async function loadKaggleToBigtable() {
  const bigtable = new Bigtable();
  const instance = bigtable.instance(BIGTABLE_INSTANCE_ID);
  const table = instance.table(BIGTABLE_TABLE_ID);

  const downloadPath = "/tmp/kaggle_bigtable";

  try {
    // 1. Download and Unzip Kaggle Dataset
    console.log(`Setting up Kaggle CLI environment...`);
    process.env.KAGGLE_CONFIG_DIR = path.resolve(__dirname, '..');
    await fs.promises.mkdir(downloadPath, { recursive: true });

    console.log(`Downloading dataset '${KAGGLE_DATASET_ID}'...`);
    const command = `kaggle datasets download -d ${KAGGLE_DATASET_ID} -p ${downloadPath} --unzip`;
    await execPromise(command, { env: process.env });
    console.log("Dataset downloaded and unzipped successfully.");

    const csvFilePath = path.join(downloadPath, "investments.csv");
    if (!fs.existsSync(csvFilePath)) {
      throw new Error("investments.csv not found in the downloaded dataset.");
    }

    // 2. Parse CSV and Batch Insert into Bigtable
    const parser = fs.createReadStream(csvFilePath).pipe(parse({
      columns: true, // Treat the first row as headers
      trim: true,
      skip_empty_lines: true,
    }));

    let rowsBatch = [];
    let totalRowsProcessed = 0;

    console.log("Starting to parse CSV and write to Bigtable...");

    for await (const record of parser) {
      // Determine the row key
      let rowKey = record.permalink;
      if (!rowKey || rowKey.trim() === "") {
        console.warn("Missing permalink, generating UUID for row key.");
        rowKey = uuidv4();
      }

      const rowData = {};
      MAPPED_COLUMNS.forEach(colName => {
        // Ensure value is a string and not null/undefined
        const value = record[colName] || "";
        rowData[colName] = value;
      });
      
      rowsBatch.push({
        key: rowKey,
        data: {
          [COLUMN_FAMILY_ID]: rowData,
        },
      });

      // If batch is full, insert it and clear
      if (rowsBatch.length >= BATCH_SIZE) {
        console.log(`Writing batch of ${rowsBatch.length} rows...`);
        await table.insert(rowsBatch);
        rowsBatch = [];
        totalRowsProcessed += BATCH_SIZE;
      }
    }

    // Insert any remaining rows
    if (rowsBatch.length > 0) {
      console.log(`Writing final batch of ${rowsBatch.length} rows...`);
      await table.insert(rowsBatch);
      totalRowsProcessed += rowsBatch.length;
    }

    console.log(`Process complete. Total rows written: ${totalRowsProcessed}`);

  } catch (error) {
    console.error("FATAL: An error occurred during the Kaggle to Bigtable process.", error);
    throw error; // Re-throw for the calling function to handle
  } finally {
    // 4. Cleanup
    console.log("Cleaning up temporary directory...");
    await fs.promises.rm(downloadPath, { recursive: true, force: true });
    console.log("Cleanup complete.");
  }
}


/**
 * An HTTP-triggered Cloud Function to start the Kaggle to Bigtable ingestion process.
 * Can be triggered manually via curl or by Cloud Scheduler.
 */
exports.ingestKaggleToBigtable = functions
  .runWith({
    timeoutSeconds: 540, // Allow up to 9 minutes for the whole process
    memory: '2GB'      // Allocate more memory for processing large files
  })
  .https.onRequest(async (req, res) => {
    console.log("Received request to start Kaggle-to-Bigtable ingestion.");
    try {
      await loadKaggleToBigtable();
      res.status(200).send("SUCCESS: Kaggle data ingestion to Bigtable completed.");
    } catch (error) {
      console.error("ERROR: Ingestion function failed.", error);
      res.status(500).send("ERROR: Kaggle data ingestion to Bigtable failed. Check logs for details.");
    }
  });
