FROM nginxinc/nginx-unprivileged:1.19-alpine
COPY ./docker/config/nginx/nginx-production.conf /etc/nginx/nginx.conf
