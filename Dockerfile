FROM node:10-alpine

# Define environment, PRO or DEV
ARG PROJECT_ENV=PRO

WORKDIR /usr/src/app

EXPOSE 3000

# In production download and install packages
COPY . /usr/src/app
RUN npm install

# Tools for development
RUN if [[ $PROJECT_ENV = "DEV" ]]; \
  then apk update && apk upgrade && apk add bash; \
  fi

CMD npm start
