FROM node:18-slim

RUN apt-get update && apt-get install -y curl

WORKDIR /app/game-service/
COPY ./game-service/package*.json ./
COPY ./game-service/*.js ./
COPY ./game-service/game ./game
COPY ../utils/* /app/utils/

RUN npm install
RUN cd /app/utils && npm install

EXPOSE 8002
CMD ["node", "start"]