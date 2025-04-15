FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -f /usr/local/bin/yt-dlp && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
