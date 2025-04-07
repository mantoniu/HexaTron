FROM node:18-slim

RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/chat-service/
COPY ./chat-service/package*.json ./
COPY ../utils/* /app/utils/

RUN npm install
RUN cd /app/utils && npm install

COPY ./chat-service/*.js ./

EXPOSE 8005
CMD ["node", "index.js"]