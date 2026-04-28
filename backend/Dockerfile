# Electra API — Production Docker image
# Base: python:3.11-slim for small image size
# Runs as non-root user for security (Cloud Run requirement)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker layer cache
# If requirements.txt doesn't change, this layer is cached even if code changes
COPY requirements.txt .

# Install dependencies — no cache to keep image small
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code AFTER installing dependencies
COPY . .

# Create a non-root user for security
# Cloud Run recommends running as non-root
RUN adduser --disabled-password --gecos "" --uid 1001 appuser
USER appuser

# Cloud Run sets PORT env var — uvicorn reads it via shell variable expansion
# Default to 8080 if PORT is not set (matches Cloud Run default)
ENV PORT=8080

# Expose the port (documentation only — Cloud Run uses PORT env var)
EXPOSE 8080

# Start the server
# Use 0.0.0.0 to accept connections from Cloud Run's load balancer
# Workers=1 because Cloud Run scales by spawning instances, not workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
