FROM node:18

# Install dependencies including certificates required for HTTPS downloads
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp && \
    echo "yt-dlp installed to:" && ls -l /usr/local/bin/yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
