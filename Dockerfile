FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app sources
COPY . .

# Allow the port to be set by environment, default to 3000
ENV PORT=3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
