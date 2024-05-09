# =====================================================================================================
# Yarn stage build js/css assets
# =====================================================================================================
FROM node:18.13.0-alpine AS yarn_stage

RUN apk add --no-cache git

WORKDIR /var/www/html/

COPY ./public /var/www/html/public
# copy configs into /build. These are required for yarn and webpack
COPY ./package.json /var/www/html/package.json
COPY ./babel.config.json /var/www/html/babel.config.json
COPY ./webpack.prod.config.js /var/www/html/webpack.prod.config.js
COPY ./yarn.lock /var/www/html/yarn.lock
# these directories must be hoisted into /build in order for webpack to work on them
RUN mkdir -p /var/www/html/src
COPY ./src/ /var/www/html/src/



# Install frontend dependencies and build static files
RUN yarn install
# # RUN yarn run build

# =====================================================================================================
# Python stage
# =====================================================================================================
FROM python:3.12.1

# Run updates
RUN apt-get update
RUN pip install --upgrade pip

# Install some dependencies necessary for supporting the SAML library
RUN apt-get install -y --no-install-recommends libxmlsec1-dev pkg-config

# Install uwsgi now because it takes a little while
RUN pip install uwsgi
# RUN useradd --system --no-create-home --shell /bin/false uwsgi

RUN mkdir /var/www/
RUN mkdir /var/www/html
RUN mkdir /var/www/site
RUN mkdir /var/www/site/learn
RUN ln -s /var/www/html /var/www/site/learn

# Add the wait for it script.
COPY docker/dockerfiles/wait_for_it.sh /wait_for_it.sh
RUN chmod +x /wait_for_it.sh



# either the site-packages directory needs to be writable for www-data for pip3 to work
# RUN chown -R www-data:www-data usr/local/lib/python3.9/site-packages
# or all dependencies need to be installed by root before switching users
# COPY app/requirements.txt /var/www/html/requirements.txt
# RUN pip install -r /var/www/html/requirements.txt


COPY /app/ /var/www/html/
RUN chown -R www-data:www-data /var/www
RUN pip install -r /var/www/html/requirements.txt

# Copy static files from yarn_stage
COPY --from=yarn_stage --chown=www-data:www-data /var/www/html/node_modules/ /var/www/html/node_modules
COPY --from=yarn_stage --chown=www-data:www-data /var/www/html/public/ /var/www/html/public
# COPY --from=yarn_stage --chown=www-data:www-data /var/www/html/webpack-stats.json /var/www/html/webpack-stats.json
USER www-data

WORKDIR /var/www/html/
# Collect static files
# COPY app /var/www/html/
# COPY app/manage.py /var/www/html/manage.py
# RUN python manage.py collectstatic --noinput
