# Use an official Node.js runtime as a parent image
FROM node:16-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for valdemir.ru
RUN npx dotenv -e .env.production.valdemir.ru -- vite build && mv dist /app/build-valdemir-ru

# Build the application for valdemir.online
RUN npx dotenv -e .env.production.valdemir.online -- vite build && mv dist /app/build-valdemir-online

# Use an official Nginx image to serve the built files
FROM nginx:alpine

# Copy the built files for valdemir.ru to the Nginx html directory
COPY --from=build /app/build-valdemir-ru /usr/share/nginx/html/valdemir-ru

# Copy the built files for valdemir.online to the Nginx html directory
COPY --from=build /app/build-valdemir-online /usr/share/nginx/html/valdemir-online

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports 80 and 443
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]