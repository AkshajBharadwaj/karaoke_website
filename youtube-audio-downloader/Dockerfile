FROM node:18

# Install ffmpeg + python and link `python` binary
RUN apt-get update && apt-get install -y ffmpeg python3 && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
