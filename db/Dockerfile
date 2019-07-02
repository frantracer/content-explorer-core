FROM mongo

WORKDIR /usr/src/app

EXPOSE 27017

# Copy scripts
COPY ./goods /usr/src/app

# Initialize mongodb
RUN mkdir -p /data/db
RUN mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db \
    && mongo mongodb-deploy-basic.js \
    && mongod --shutdown

# Start server
CMD mongod
