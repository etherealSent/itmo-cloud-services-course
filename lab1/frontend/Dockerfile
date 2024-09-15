FROM node:alpine as build

COPY package.json package.json
RUN npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /dist /usr/share/nginx/html
COPY 404.html /usr/share/nginx/errors/404.html
COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]