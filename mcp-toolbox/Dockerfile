
FROM debian:bullseye

WORKDIR /app

# Download the binary and make it executable
ADD https://storage.googleapis.com/genai-toolbox/v0.14.0/linux/amd64/toolbox /usr/local/bin/toolbox-server
RUN chmod +x /usr/local/bin/toolbox-server

# Copy our custom tools.yaml file into the container
COPY tools.yaml /app/tools.yaml

# Expose port 8080 for Cloud Run
EXPOSE 8080

CMD exec toolbox-server --tools-file /app/tools.yaml --port ${PORT:-8080} --host 0.0.0.0