# Use official Node.js image
FROM node:18

# Install ffmpeg for audio processing
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the source code
COPY . .

# Expose port (must match your Express server)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
