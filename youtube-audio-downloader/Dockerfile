FROM node:18

# Install ffmpeg for audio conversion
RUN apt-get update && \
    apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
