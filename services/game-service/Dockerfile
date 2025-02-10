FROM node:18-slim

ENV GATEWAY_URL=http://gateway:8000

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./index.js /app/index.js
COPY ./game /app/game
##COPY ./healthcheck.js /app
EXPOSE 8002
CMD ["npm", "start"]