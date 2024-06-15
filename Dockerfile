FROM node:current-alpine
ENV APP_HOME="/home/node/app"
WORKDIR ${APP_HOME}
RUN apk add git
RUN git clone https://github.com/damiencassu/mermaid.git ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install
EXPOSE 47129
VOLUME /home/node/app/logs
VOLUME /home/node/app/accessory
CMD npm start
