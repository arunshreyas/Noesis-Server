FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Use .dockerignore to exclude unnecessary files like node_modules from the host
COPY package*.json ./
RUN npm install --omit=dev

# Copy app sources and relevant config files
COPY . ./

# Allow the port to be set by environment, default to 3000
ENV PORT=3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
