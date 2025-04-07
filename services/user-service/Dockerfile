FROM node:18-slim

RUN apt-get update && apt-get install -y curl

WORKDIR /app/user-service/
COPY ./user-service/package*.json ./
COPY ../utils/* /app/utils/

RUN npm install
RUN cd /app/utils && npm install

COPY ./user-service/*.js ./
COPY ../database-initializer/type-documentation.js /app/database-initializer/

EXPOSE 8003
CMD ["node", "index.js"]