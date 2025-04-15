# Use official Node.js image
FROM node:18

# Install system dependencies: ffmpeg + yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install -U yt-dlp && \
    ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all other source code
COPY . .

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
