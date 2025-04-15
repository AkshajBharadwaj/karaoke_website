# Use an official Node base image
FROM node:18

# Install dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl python3 python3-pip && \
    pip3 install -U yt-dlp && \
    ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose the app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
