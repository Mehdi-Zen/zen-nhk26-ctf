FROM node:22.12-alpine AS build

WORKDIR /app

COPY src/package*.json ./
RUN npm ci

COPY src/ .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY src/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
