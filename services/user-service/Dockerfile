FROM node:18-slim

ENV REFRESH_TOKEN_SECRET="test"
ENV ACCESS_TOKEN_SECRET="test"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./index.js /app/index.js
##COPY ./healthcheck.js /app
EXPOSE 8003
CMD ["npm", "start"]