# Use official Node.js image
FROM node:18

# Install ffmpeg + python3 + youtube-dl
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install --no-cache-dir youtube-dl

# Set working directory
WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose backend port
EXPOSE 3000

# Run server
CMD ["node", "server.js"]
