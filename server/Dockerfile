FROM node:20

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

# Generate Prisma client after dependencies are installed
RUN npx prisma generate

COPY . .

EXPOSE 3000

# Run migrations then start the server
CMD ["node", "index.js"]
