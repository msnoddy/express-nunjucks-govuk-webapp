FROM node:10.16-alpine

ARG APP_PATH=/opt/govuk-webapp

RUN mkdir -p ${APP_PATH}

COPY src ${APP_PATH}/src
COPY views ${APP_PATH}/views
COPY .yarnclean runApp.sh tsconfig.json package.json yarn.lock ${APP_PATH}/

WORKDIR ${APP_PATH}

RUN apk add findutils && \
    yarn build && \
    rm -rf node_modules && \
    yarn install --production && \
    rm -f .yarnclean package.json tsconfig.json yarn.lock && \
    rm -rf src && \
    apk del findutils

ENV EXPRESS_PORT=80

ENTRYPOINT [ "/bin/sh" ]
CMD [ "runApp.sh" ]
