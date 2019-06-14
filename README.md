# express-nunjucks-govuk-webapp

Simple web application for goverment projects. 

This project uses:
 - TypeScript
 - Express
 - Nunjucks
 - GOV.UK Frontend

## Quickstart

- Install either node.js v10.x or nvm installed
- Install yarn
- Run `yarn launch`
- Open a web browser @ http://localhost:8080

## Distribution

- Run `yarn build`
- Copy the below to a new directory:
    - dist
    - node_modules
    - views
    - runApp.sh
- To start the app, use the `runApp.sh` script

## Docker

The repository contains a `Dockerfile`, build a docker image by running:

```
    docker build . -t govuk-webapp
```

Start a new container by running:

```
    docker run --rm -p 8080:80 govuk-webapp
```

You can now hit the app @ http://localhost:8080
