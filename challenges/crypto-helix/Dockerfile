FROM node:22.12-bookworm-slim AS build

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  chromium \
  fonts-noto-color-emoji \
  fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY src/package*.json ./
RUN npm ci
COPY src/ .
RUN npm run generate:loops
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY src/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
