FROM python:3.12-slim

# Create non-root user for security
RUN addgroup --system procureai && adduser --system --ingroup procureai procureai

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Switch to non-root user
USER procureai

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
