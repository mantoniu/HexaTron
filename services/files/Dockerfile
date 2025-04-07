FROM node:18-slim AS base

RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY package*.json ./
RUN npm install

################################################

FROM base AS dev

COPY ./*.js ./

EXPOSE 8001
CMD ["node", "index.js"]
################################################

FROM base AS prod

COPY ./*.js ./
COPY ./front ./front
EXPOSE 8001
CMD ["node", "index.js"]