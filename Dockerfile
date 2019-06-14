FROM node:10.16-alpine

ARG APP_PATH=/opt/govuk-webapp

RUN mkdir -p ${APP_PATH}

COPY dist ${APP_PATH}/dist
COPY node_modules ${APP_PATH}/node_modules
COPY views ${APP_PATH}/views
COPY runApp.sh ${APP_PATH}

ENV EXPRESS_PORT=80

WORKDIR ${APP_PATH}

ENTRYPOINT [ "/bin/sh" ]
CMD [ "runApp.sh" ]
