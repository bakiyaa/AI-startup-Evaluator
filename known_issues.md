# Known Issues

## `ingest-public-data` Cloud Function Health Check Failure

**Date:** 2025-09-13

**Summary:**

The `ingest-public-data` Cloud Function is failing to deploy due to a container health check failure. The error message is:

```
Error waiting to create function: Error waiting for Creating function: Error code 3, message: Could not create or update Cloud Run service ingest-public-data, Container Healthcheck failed. Revision 'ingest-public-data-00001-zaf' is not ready and cannot serve traffic. The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable within the allocated timeout. This can happen when the container port is misconfigured or if the timeout is too short. The health check timeout can be extended. Logs for this revision might contain more information.
```

**Troubleshooting Steps Taken:**

1.  **Simplified the function to a "Hello, World!" example:** This did not resolve the issue.
2.  **Verified the `package.json` and `package-lock.json` files are in sync:** This did not resolve the issue.
3.  **Explicitly set the port in the `start` script:** This did not resolve the issue.
4.  **Attempted to deploy the function directly with `gcloud`:** This also failed with the same error.
5.  **Attempted to view the logs for the failed revision:** The logs were empty.

**Conclusion:**

The root cause of this issue is unknown. It is likely an issue with the environment or configuration that I am unable to debug further. It is recommended to consult the Google Cloud support documentation or contact Google Cloud support for further assistance.
