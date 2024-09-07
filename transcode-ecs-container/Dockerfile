FROM node:18-alpine AS base

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg


WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install


COPY index.js .


CMD [ "npm", "start" ]


