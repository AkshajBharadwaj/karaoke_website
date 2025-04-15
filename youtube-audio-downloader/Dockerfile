FROM node:18

# Install ffmpeg and curl
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/bin/yt-dlp && chmod +x /usr/bin/yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
