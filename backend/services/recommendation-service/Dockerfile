# Use an official Python runtime as a parent image
FROM python:3.10-slim

WORKDIR /app

# Install build dependencies for pandas and numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Copy the source code
COPY . .

# Expose port (internal)
EXPOSE 3003

# Run the app
# Using sh -c to allow variable expansion for PORT
CMD sh -c "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-3003}"
