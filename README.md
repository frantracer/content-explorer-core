# Prepare project

Download project

```
export APP=content-explorer-core
git clone https://github.com/frantracer/$APP
```

Create directory with the following files:

```
- config
|- cert.pem
|- key.pem
|- core.env
```

Build docker images

```
cd $APP/db
sudo docker build -t content-explorer-db:latest .
cd ..
sudo docker build -t $APP:latest .
```


# Development environment

Create containers

```
sudo docker run -d --network host --name content-explorer-db content-explorer-db
sudo docker run -it --network host --name $APP -v $(pwd)/../config:/etc/linkurator/config -v $(pwd):/usr/src/app $APP /bin/sh
```

Download packages

`npm install`

Set server configuration

`ln -sfn /etc/linkurator/config/core.env .env`

Start application

`npm start`

The API will be available at:

https://localhost:3000/api


# Production environment

Create and launch container

```
sudo docker run -d --network host --name content-explorer-db content-explorer-db
sudo docker run -d --network host --name $APP -v $(pwd)/../config:/etc/linkurator/config $APP
```
