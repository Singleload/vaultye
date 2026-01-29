# Vi använder Alpine för att hålla det litet
FROM node:20-alpine

# --- NYTT: Installera OpenSSL som Prisma kräver ---
RUN apk add --no-cache openssl

WORKDIR /app

# Kopiera package-filer och installera
COPY package*.json ./
RUN npm install

# Kopiera källkod och prisma-mappen
COPY . .

# Generera Prisma Client
RUN npx prisma generate

# Exponera porten
EXPOSE 3000

# Kör migreringar och starta
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]