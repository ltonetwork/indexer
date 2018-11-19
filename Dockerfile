FROM node:carbon-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN apk add --no-cache curl

RUN npm i

RUN npm i pm2 -g

# Bundle app source
COPY . .

RUN npm run build

RUN rm -rf node_modules/

RUN npm i --only=production

EXPOSE 80
CMD ["pm2-runtime", "dist/main.js"]