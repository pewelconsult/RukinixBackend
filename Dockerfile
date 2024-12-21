FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files - adjust these paths based on your actual structure
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]