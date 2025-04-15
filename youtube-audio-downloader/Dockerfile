FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install yt-dlp

# Set PATH just in case
ENV PATH="/root/.local/bin:${PATH}"

# Create app directory
WORKDIR /app

# Copy app files
COPY . .

# Install Node dependencies
RUN npm install

# Start server
CMD ["node", "server.js"]
