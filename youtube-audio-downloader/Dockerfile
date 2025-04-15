FROM node:18

# Install ffmpeg and curl
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Set working dir
WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
