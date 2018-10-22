FROM php:7.1.22-fpm-alpine
MAINTAINER Ian Turgeon

RUN apk add --no-cache \
	autoconf \
	bash \
	build-base \
	cyrus-sasl-dev \
	freetype \
	git \
	libjpeg-turbo-dev \
	libmcrypt-dev \
	libmemcached-dev \
	libpng-dev \
	libxml2-dev \
	zlib-dev


# PECL Libraries
# memcached build manually
RUN docker-php-ext-configure gd --with-jpeg-dir=/usr/include

RUN docker-php-ext-install \
	bcmath \
	gd \
	mbstring \
	mcrypt \
	pdo_mysql \
	xml \
	zip \
	&& rm -rf /usr/src/php

RUN git clone -b v3.0.2 https://github.com/php-memcached-dev/php-memcached.git \
	&& cd php-memcached \
	&& git checkout php7 \
	&& phpize \
	&& ./configure \
	&& make \
	&& make install \
	&& docker-php-ext-enable memcached \
	&& rm -rf /usr/src/php

# Make sure composer is installed globally
RUN bash -c "curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer"

# hack to let php write to the shared disk with boot2docker shares
# files shared from host into a container appear to use a user on host with UID 1000
# looks like this container not only doesnt have a user at 1000, but the www-data user cant write to these files
# so, this changes www-data's uid to 1000
# RUN usermod -u 1000 www-data
RUN sed -i "s/^www-data:x:[0-9]*/www-data:x:1000/" /etc/passwd

RUN pecl install xdebug

# add script that helps us wait for other containers
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
