FROM node:12.3.1-slim
MAINTAINER Ian Turgeon

RUN apt-get update && apt-get install -y \
  build-essential \
  fontconfig \
  git \
  python-dev \
  zip \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install --global yarn@v1.16.0

WORKDIR /var/www/html

# Define default command.
CMD ["bash"]
