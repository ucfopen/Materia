# This dockerfile is meant to spin up the h5p-server alone

FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN yarn install

# Bundle app source
COPY . .

# for local development, don't copy existing h5p info into
# fresh docker container
# RUN rm -r h5p/core h5p/editor h5p/libraries h5p/temporary-storage
# RUN mkdir h5p/core h5p/editor h5p/libraries h5p/temporary-storage

RUN ./setup.sh

EXPOSE 3000

CMD ["yarn", "start"]