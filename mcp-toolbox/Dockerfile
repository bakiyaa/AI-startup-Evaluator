# Use the pre-built MCP Toolbox image as a base
FROM us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:0.14.0

# Copy our custom tools.yaml file into the container
COPY tools.yaml /app/tools.yaml

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Set the command to start the toolbox server with our tools file
CMD ["--tools-file", "/app/tools.yaml", "--port", "8080"]
