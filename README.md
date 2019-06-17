# Prepare project

Download project

`git clone https://github.com/frantracer/content-explorer-core`

Set server configuration .env file

# Development environment

Build docker image

`docker build --build-arg PROJECT_ENV=DEV -t content-explorer-core:latest .`

Create container

`docker create -it --name content-explorer-core -p 3000:3000 -v $(pwd):/usr/src/app content-explorer-core /bin/bash`

Start and attach to the container

`docker start -i content-explorer-core`

Download packages

`npm install`

Start application

`npm start`

The API will be available at:

http://localhost:3000/api

# Production environment

Build docker image

`docker build -t content-explorer-core:latest .`

Create and launch container

`docker run -d --name content-explorer-core -p 3000:3000 content-explorer-core`
