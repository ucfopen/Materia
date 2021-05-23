FROM ghcr.io/ucfopen/materia:app-v8.0.0

# become root to access mounted secret
USER root
# use mounted secret to download ucfaut
RUN --mount=type=secret,id=token curl --silent -H "Authorization: token $(cat /run/secrets/token)" -H 'Accept: application/vnd.github.v3.raw' -s -L https://github.com/ucfcdl/Materia-UCFAuth/archive/refs/tags/v1.0.2.zip --output /tmp/materia-ucfauth.zip
# return to normal user
USER www-data

# make sure composer doesn't cache any packages
ENV COMPOSER_CACHE_DIR=/dev/null
# tell compser where to fild the package
RUN composer config repositories.ucfauth '{"type": "package", "package": { "name": "materia/ucfauth", "type": "fuel-package", "version": "1.0.2", "dist": { "type": "zip", "url": "/tmp/materia-ucfauth.zip"}}}'
# install the package
RUN composer require --no-progress --update-no-dev --no-scripts --prefer-dist --optimize-autoloader --ignore-platform-reqs materia/ucfauth:1.0.2
