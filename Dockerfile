FROM node:latest
WORKDIR /home/node/app
RUN git clone https://github.com/damiencassu/mermaid.git ./
ARG GITHUB_TOKEN
RUN echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc 
RUN npm install
EXPOSE 47129
VOLUME /home/node/app/logs
VOLUME /home/node/app/accessory
CMD npm start
