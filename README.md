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

Build docker image

```
cd $APP
sudo docker build -t $APP:latest .
```


# Development environment

Create container

`sudo docker run -it --name $APP -v $(pwd)/../config:/etc/linkurator/config -v $(pwd):/usr/src/app -p 3000:3000 $APP /bin/sh`

Download packages

`npm install`

Set server configuration

`ln -s /etc/linkurator/config/core.env .env`

Start application

`npm start`

The API will be available at:

https://localhost:3000/api


# Production environment

Create and launch container

`sudo docker run -d --name $APP -v $(pwd)/../config:/etc/linkurator/config -p 3000:3000 $APP`
