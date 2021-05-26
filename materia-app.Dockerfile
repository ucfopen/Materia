# =====================================================================================================
# Base stage used for build and final stages
# =====================================================================================================
FROM php:7.4-fpm-alpine AS base_stage

ARG PHP_EXT="bcmath gd pdo_mysql xml zip opcache"
ARG PHP_MEMCACHED_VERSION="v3.1.5"

ARG COMPOSER_VERSION="1.10.0"
ARG COMPOSER_INSTALLER_URL="https://raw.githubusercontent.com/composer/getcomposer.org/d2c7283f9a7df2db2ab64097a047aae780b8f6b7/web/installer"
ARG COMPOSER_INSTALLER_SHA="e0012edf3e80b6978849f5eff0d4b4e4c79ff1609dd1e613307e16318854d24ae64f26d17af3ef0bf7cfb710ca74755a"

# os packages needed for php extensions
ARG BASE_PACKAGES="bash zip libmemcached-dev libxml2-dev zip libzip libzip-dev git freetype libpng libjpeg-turbo"
ARG BUILD_PACKAGES="autoconf build-base cyrus-sasl-dev libpng-dev libjpeg-turbo-dev shadow"
ARG PURGE_FILES="/var/lib/apt/lists/* /usr/src/php /usr/include /usr/local/include /usr/share/doc /usr/share/doc-base /var/www/html/php-memcached"

RUN apk add --no-cache $BASE_PACKAGES $BUILD_PACKAGES \
	&& usermod -u 1000 www-data && groupmod -g 1000 www-data \
	# ======== PHP XDEBUG
	&& pecl install xdebug \
	&& docker-php-ext-enable xdebug \
	&& docker-php-ext-configure gd --with-jpeg=/usr/include \
	&& docker-php-ext-install $PHP_EXT \
	&& git clone -b $PHP_MEMCACHED_VERSION https://github.com/php-memcached-dev/php-memcached.git \
	&& cd php-memcached \
	&& phpize \
	&& ./configure \
	&& make \
	&& make install \
	&& docker-php-ext-enable $PHP_EXT_ENABLE memcached \
	&& apk del $BUILD_PACKAGES \
	&& rm -rf $PURGE_FILES

# ======== PHP COMPOSER
RUN php -r "copy('$COMPOSER_INSTALLER_URL', 'composer-setup.php');"
RUN php -r "if (hash_file('sha384', 'composer-setup.php') === '$COMPOSER_INSTALLER_SHA') { echo 'COMPOSER VERIFIED'; } else { echo 'COMPOSER INVALID'; exit(1); } echo PHP_EOL;"
RUN php composer-setup.php --install-dir=/usr/local/bin --filename=composer --version=$COMPOSER_VERSION

# Use the default production configuration
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

# =====================================================================================================
# composer stage runs composer install
# =====================================================================================================
FROM base_stage as composer_stage

USER www-data

# ======== COPY APP IN
COPY --chown=www-data:www-data ./README.md /var/www/html/README.md
COPY --chown=www-data:www-data ./fuel /var/www/html/fuel
COPY --chown=www-data:www-data ./public /var/www/html/public
COPY --chown=www-data:www-data ./.env /var/www/html/.env
COPY --chown=www-data:www-data ./composer.json /var/www/html/composer.json
COPY --chown=www-data:www-data ./composer.lock /var/www/html/composer.lock
COPY --chown=www-data:www-data ./oil /var/www/html/oil

RUN composer install --no-cache --no-dev --no-progress --no-scripts --prefer-dist --optimize-autoloader

# =====================================================================================================
# Yarn stage buils js/css assets
# =====================================================================================================
FROM node:12.11.1-alpine AS yarn_stage

RUN apk add --no-cache git

COPY ./public /build/public
COPY ./package.json /build/package.json
COPY ./process_assets.js /build/process_assets.js
COPY ./yarn.lock /build/yarn.lock
# make sure the directory where asset_hash.json is generated exists
RUN mkdir -p /build/fuel/app/config/
RUN cd build && yarn install --frozen-lockfile --non-interactive --production --silent --pure-lockfile --force


# =====================================================================================================
# final stage creates the final deployable image
# =====================================================================================================
FROM base_stage as FINAL_STAGE

COPY docker/config/php/materia.php.ini $PHP_INI_DIR/conf.d/materia.php.ini


USER www-data
# ======== COPY FINAL APP
COPY --from=composer_stage --chown=www-data:www-data /var/www/html /var/www/html
COPY --from=yarn_stage --chown=www-data:www-data /build/public /var/www/html/public
COPY --from=yarn_stage --chown=www-data:www-data /build/fuel/app/config/asset_hash.json /var/www/html/fuel/app/config/asset_hash.json
