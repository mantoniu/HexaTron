FROM node:18-slim

RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/notifications-service/
COPY ./notifications-service/package*.json ./
COPY ../utils/* /app/utils/

RUN npm install
RUN cd /app/utils && npm install

COPY ./notifications-service/*.js ./
COPY ../database-initializer/type-documentation.js /app/database-initializer/
COPY ./notifications-service/firebase-key.json ./firebase-key.json

EXPOSE 8007
CMD ["node", "index.js"]