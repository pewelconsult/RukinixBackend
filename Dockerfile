FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY database.js app.js 

# The .dockerignore should be created before building, not during
# Remove these lines:
# COPY .dockerignore ./
# RUN echo "node_modules\n.git\n.gitignore\nnpm-debug.log" > .dockerignore

EXPOSE 3000

CMD ["node", "app.js"]