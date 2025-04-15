FROM node:18

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    pip3 install yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
