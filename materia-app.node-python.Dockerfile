FROM nikolaik/python-nodejs:python3.12-nodejs18-slim
# Run updates
RUN apt-get update
RUN pip install --upgrade pip

# Install some dependencies necessary for supporting the SAML library
RUN apt-get install -y --no-install-recommends libxmlsec1-dev pkg-config

# Install uwsgi now because it takes a little while
RUN apt-get update && \
    apt-get install -y gcc && \
    pip install uwsgi
# RUN useradd --system --no-create-home --shell /bin/false uwsgi

RUN mkdir /var/www/
RUN mkdir /var/www/html
RUN mkdir /var/www/site
RUN mkdir /var/www/site/learn
RUN ln -s /var/www/html /var/www/site/learn

# Add the wait for it script.
COPY docker/dockerfiles/wait_for_it.sh /wait_for_it.sh
RUN chmod +x /wait_for_it.sh

COPY ./app/ /var/www/html

COPY ./package.json /var/www/html/package.json
COPY ./yarn.lock /var/www/html/yarn.lock
COPY ./src /var/www/html/src
COPY ./public /var/www/html/public
# COPY ./fuel/packages /var/www/html/fuel/packages
COPY ./babel.config.json /var/www/html/babel.config.json
COPY ./webpack.prod.config.js /var/www/html/webpack.prod.config.js


WORKDIR /var/www/html
RUN yarn install

RUN chown -R www-data:www-data /var/www

RUN apt-get update && apt-get install -y \
    python3-dev \
    default-libmysqlclient-dev

RUN pip install -r /var/www/html/requirements.txt

USER www-data

WORKDIR /var/www/html/
# Collect static files
# COPY app /var/www/html/
# COPY app/manage.py /var/www/html/manage.py
# RUN python manage.py collectstatic --noinput
