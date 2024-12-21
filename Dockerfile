# Use Node 22 image
FROM node:22

# Create app directory in container
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Define the port number the container should expose
EXPOSE 3000

# Command to run your application
CMD [ "node", "api.js" ]