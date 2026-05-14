FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install
COPY src/requirements.txt .
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Copy the source code and the question file
COPY src/ ./src/
COPY Gamified_quiz_questions.json .

# Run from the root folder so python can find 'src'
CMD sh -c "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-3002}"
