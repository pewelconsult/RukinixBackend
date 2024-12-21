FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY database.js app.js 

EXPOSE 3000

CMD ["node", "app.js"]