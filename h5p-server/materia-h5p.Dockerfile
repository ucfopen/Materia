FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./h5p-server/package*.json ./

# Copy Materia's env file(s) to the current working directory
COPY .env* ./

RUN yarn install

# Bundle app source
COPY ./h5p-server .

# for local development, don't copy existing h5p info into
# fresh docker container
# RUN rm -r h5p/core h5p/editor h5p/libraries h5p/temporary-storage
# RUN mkdir h5p/core h5p/editor h5p/libraries h5p/temporary-storage

RUN ./setup.sh

EXPOSE 3000

# set in docker-compose
ARG ENVIRONMENT
ENV ENVIRONMENT $ENVIRONMENT

CMD yarn start:${ENVIRONMENT}