# Steg 1: Bygg React-appen
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Steg 2: Servera med Nginx
FROM nginx:alpine
# Kopiera den byggda appen från steg 1
COPY --from=build /app/dist /usr/share/nginx/html
# Kopiera vår nginx-konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]