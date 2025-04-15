FROM node:18

# Install ffmpeg and youtube-dl
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install youtube-dl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
