FROM node:20-alpine

WORKDIR /app

# Kopiera package-filer och installera
COPY package*.json ./
RUN npm install

# Kopiera källkod och prisma-mappen
COPY . .

# Generera Prisma Client så backend kan prata med databasen
RUN npx prisma generate

# Exponera porten
EXPOSE 3000

# Kör migreringar mot databasen och starta sedan servern
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]