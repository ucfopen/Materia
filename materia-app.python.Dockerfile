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

RUN mkdir /var/www/
RUN mkdir /var/www/html

# Add the wait for it script.
COPY patjango/dockerfiles/wait_for_it.sh /wait_for_it.sh
RUN chmod +x /wait_for_it.sh

COPY /app/ /var/www/html/
RUN chown -R www-data:www-data /var/www
RUN pip install -r /var/www/html/requirements.txt

USER www-data

WORKDIR /var/www/html/
