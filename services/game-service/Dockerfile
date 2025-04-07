FROM node:18-slim

RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/game-service/
COPY ./game-service/package*.json ./
RUN npm install

COPY ../utils/* /app/utils/
RUN cd /app/utils && npm install

COPY ./game-service/*.js ./
COPY ./game-service/game ./game

EXPOSE 8002
CMD ["node", "index.js"]