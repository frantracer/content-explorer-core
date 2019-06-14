FROM node:10

WORKDIR /usr/src/app

EXPOSE 3000

CMD node server/app.js
