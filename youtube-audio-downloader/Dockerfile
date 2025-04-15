FROM node:18

# Install Python, ffmpeg, and pip-based yt-dlp globally
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install --break-system-packages yt-dlp && \
    ln -s $(which yt-dlp) /usr/local/bin/yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
