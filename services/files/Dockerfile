FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./index.js /app/index.js
COPY ./front ./front
COPY ./logic.js ./logic.js
##COPY ./healthcheck.js /app
EXPOSE 8001
CMD ["npm", "start"]