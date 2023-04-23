FROM node:18 As build

# Create app directory
WORKDIR /usr/src

# Install app dependencies
COPY package*.json ./

RUN npm i

# Bundle app source
COPY . .

RUN npm version $(git describe --tags) --no-git-tag-version

RUN npm run build

RUN rm -rf node_modules/

RUN npm i --only=production

FROM node:18-alpine
# Move the build files from build folder to app folder
WORKDIR /usr/app
COPY --from=build /usr/src/dist ./
COPY --from=build /usr/src/node_modules ./node_modules/

RUN npm install -g pm2

EXPOSE 80
CMD ["pm2-runtime", "main.js"]
