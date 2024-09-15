FROM node:alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install
COPY . .

RUN npm run build:valdemir.ru && mv build /app/build-valdemir-ru

RUN npm run build:valdemir.online && mv build /app/build-valdemir-online

# Build the application for valdemir.online
# RUN REACT_APP_API_URL=https://valdemir.online/api npm run build

FROM nginx:stable-alpine

COPY --from=build /app/build-valdemir-ru /usr/share/nginx/html/valdemir-ru

COPY --from=build /app/build-valdemir-online /usr/share/nginx/html/valdemir-online
# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]