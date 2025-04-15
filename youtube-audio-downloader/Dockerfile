FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Create app directory
WORKDIR /app

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Start server
CMD ["node", "server.js"]
