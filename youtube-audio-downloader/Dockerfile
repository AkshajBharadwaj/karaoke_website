FROM node:18

# Install ffmpeg and yt-dlp (from apt, not curl)
RUN apt-get update && \
    apt-get install -y ffmpeg yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
