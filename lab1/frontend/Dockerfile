FROM node:alpine as build

COPY package.json package.json
RUN npm install
COPY . .

RUN REACT_APP_API_URL=https://valdemir.ru/api npm run build

# Build the application for valdemir.online
# RUN REACT_APP_API_URL=https://valdemir.online/api npm run build

FROM nginx:stable-alpine

COPY --from=build /dist /usr/share/nginx/html

COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]