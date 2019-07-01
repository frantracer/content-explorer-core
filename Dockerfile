FROM node:10-alpine

WORKDIR /usr/src/app

EXPOSE 3000

# Download and install packages
COPY . /usr/src/app
RUN npm install

# Create external configuration directory
RUN mkdir -p /etc/linkurator/config

# Link external configuration
RUN ln -sfn /etc/linkurator/config/core.env .env

# Start server
CMD npm start
