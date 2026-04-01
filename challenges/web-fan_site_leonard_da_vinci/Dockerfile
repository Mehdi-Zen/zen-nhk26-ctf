FROM nginx:alpine

COPY src/nginx.conf /etc/nginx/conf.d/default.conf
COPY src/app/ /var/www/app/

EXPOSE 580

CMD ["nginx", "-g", "daemon off;"]
