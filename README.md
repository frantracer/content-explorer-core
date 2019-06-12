# Prepare general environment

Create docker images:

`sudo su`

`docker build -t content-explorer-core:latest .`

`docker create -it --name content-explorer-core -p 3000:3000 -v $(pwd):/usr/src/app content-explorer-core /bin/bash`

# Development environment

Launch container

`docker start -i content-explorer-core`

`npm install`

`npm start`

The API will be available at:

http://localhost:3000/api
