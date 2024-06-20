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

RUN chown -R www-data:www-data /var/www

# either the site-packages directory needs to be writable for www-data for pip3 to work
# RUN chown -R www-data:www-data usr/local/lib/python3.9/site-packages
# or all dependencies need to be installed by root before switching users
COPY app/requirements.txt /var/www/html/requirements.txt
RUN pip install -r /var/www/html/requirements.txt

USER www-data

WORKDIR /var/www/html
