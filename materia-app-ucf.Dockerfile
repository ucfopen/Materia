FROM ghcr.io/ucfopen/materia:app-v8.0.0

# Requires you to download the materia-auth package prior to build. EX:
# curl -H "Authorization: token $SECRET_TOKEN" -H 'Accept: application/vnd.github.v3.raw' -s -L https://github.com/ucfcdl/Materia-UCFAuth/archive/refs/tags/v1.0.2.zip ./materia-ucfauth.zip
COPY --chown=www-data:www-data ./materia-ucfauth.zip /tmp/materia-ucfauth.zip

# make sure composer doesn't cache any packages
ENV COMPOSER_CACHE_DIR=/dev/null
# tell compser where to fild the package
RUN composer config repositories.ucfauth '{"type": "package", "package": { "name": "materia/ucfauth", "type": "fuel-package", "version": "1.0.2", "dist": { "type": "zip", "url": "/tmp/materia-ucfauth.zip"}}}'
# install the package
RUN composer require --no-progress --update-no-dev --no-scripts --prefer-dist --optimize-autoloader --ignore-platform-reqs materia/ucfauth:1.0.2
