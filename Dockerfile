FROM node:carbon-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm i --only=production

RUN npm i pm2 -g

# Bundle app source
COPY . .

EXPOSE 3000
ENTRYPOINT ["pm2-runtime", "src/index.js"]