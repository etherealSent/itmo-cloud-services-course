# Use an official Node.js runtime as a parent image
FROM node:14-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for valdemir.ru
RUN npm run build:valdemir.ru && mv build /app/build-valdemir-ru

# Build the application for valdemir.online
RUN npm run build:valdemir.online && mv build /app/build-valdemir-online

# Use an official Nginx image to serve the built files
FROM nginx:alpine

# Copy the built files for valdemir.ru to the Nginx html directory
COPY --from=build /app/build-valdemir-ru /usr/share/nginx/html/valdemir-ru

# Copy the built files for valdemir.online to the Nginx html directory
COPY --from=build /app/build-valdemir-online /usr/share/nginx/html/valdemir-online

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]