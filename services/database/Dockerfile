FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY ./TypesValidation.js ./app/TypesValidation.js
COPY ./index.js ./app/index.js

##COPY ./healthcheck.js /app

CMD ["npm", "start"]