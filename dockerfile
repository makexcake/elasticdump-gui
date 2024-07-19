FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g elasticdump
RUN mkdir imported-indices

COPY . .

EXPOSE 3000

CMD ["npm", "start"]