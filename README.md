# Prepare project

Download project

```
git clone https://github.com/frantracer/content-explorer-core
```

Create directory with the following files:

```
- config
|- cert.pem
|- key.pem
|- core.env
```

Install docker (https://docs.docker.com/install/)


# Development environment

Run the following command and follow instructions:

```
python deploy.py --config ../config/ --clear --env DEV
```

The API will be available at:

https://localhost:3000/api


# Production environment

Run the following command:

```
python deploy.py --config ../config/ --clear --env PRO
```
