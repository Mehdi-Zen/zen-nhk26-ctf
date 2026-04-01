# CH06 - Caine: Blind SQL Injection Challenge
# Niveau: Hard

FROM python:3.11-slim

# Metadata
LABEL maintainer="CTF NHK26"
LABEL description="Blind SQL Injection Challenge - Boolean-based with WAF bypass"
LABEL version="1.0"

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies and curl for healthcheck
RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy application files
COPY src/app.py .
COPY src/templates/ templates/

# Create non-root user for security
RUN useradd -m -u 1000 ctfuser && \
    chown -R ctfuser:ctfuser /app

# Switch to non-root user
USER ctfuser

# Expose port
EXPOSE 5000

# Environment
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "30", "--access-logfile", "-", "app:app"]
