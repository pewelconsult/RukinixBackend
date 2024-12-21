# Use Node 22.11.0 as the base image
FROM node:22.11.0

# Create and set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY api.js database.js ./
COPY .env ./

# Don't copy unnecessary files
COPY .dockerignore ./
RUN echo "node_modules\n.git\n.gitignore\nnpm-debug.log" > .dockerignore

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "api.js"]