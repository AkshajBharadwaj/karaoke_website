FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install yt-dlp && \
    chmod +x /root/.local/bin/yt-dlp

# Make sure yt-dlp is in PATH
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
