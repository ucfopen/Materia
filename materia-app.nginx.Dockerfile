FROM nginxinc/nginx-unprivileged:alpine3.22-perl

COPY ./docker/config/nginx/sites-enabled /etc/nginx/conf.d
COPY ./docker/config/nginx/nginx.prod.conf /etc/nginx/nginx.conf
COPY ./public /var/www/html/staticfiles

USER root
RUN chmod -R 0755 /etc/nginx/conf.d && \
    chmod 0644 /etc/nginx/nginx.conf && \
    chmod -R 0755 /var/www/html/staticfiles
USER 101