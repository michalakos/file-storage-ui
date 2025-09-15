# Simple dev Dockerfile – not for production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the default Vite/Vue dev port
EXPOSE 5173

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
