# Crazy Casino - INSANE Web Challenge
# Single container with Node.js, Redis, SQLite, Nginx

FROM node:20-alpine

# Install dependencies + build tools for better-sqlite3
RUN apk add --no-cache \
    nginx \
    redis \
    supervisor \
    sqlite \
    curl \
    bash \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /var/log/supervisor /var/run/redis /data

# Initialize SQLite database
RUN sqlite3 /data/casino.db < /app/scripts/init.sql

# Copy nginx config
COPY config/nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor config
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create flag file (fragment 4)
RUN echo "57UtUbCEBp6}" > /flag.txt && chmod 400 /flag.txt

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor (manages all services)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
