
FROM nginx:stable-alpine

COPY ./docker/config/nginx/nginx.conf /etc/nginx/nginx.conf
