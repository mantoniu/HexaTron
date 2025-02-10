FROM node:18-slim

ENV REFRESH_TOKEN_SECRET="test"
ENV ACCESS_TOKEN_SECRET="test"
ENV USER_SERVICE_URL=http://user-service:8003
ENV GAME_SERVICE_URL=http://game-service:8002
ENV FILES_URL=http://files:8001

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./index.js /app/index.js
##COPY ./healthcheck.js /app
EXPOSE 8000
CMD ["npm", "start"]