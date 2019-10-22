FROM node:12-alpine as build

COPY ./ /tmp/
WORKDIR /tmp/

RUN apk add bash findutils && \
    rm -rf node_modules && \
    yarn package

FROM node:12-alpine 

ARG APP_PATH=/opt/govuk-webapp

ENV EXPRESS_PORT=80
ENV LOG_PATH=/var/log
ENV APP_CONFIG=/etc/config.json

COPY --from=build /tmp/dist/ ${APP_PATH}
COPY --from=build /tmp/config.json ${APP_CONFIG}

WORKDIR ${APP_PATH}

ENTRYPOINT [ "./bin/run" ]
