FROM node:16-alpine as build

WORKDIR /app

COPY package.json package.json
RUN npm install

COPY . .
RUN npm run build

RUN ls -l /app/diste

FROM nginx:stable-alpine

RUN mkdir -p /usr/share/nginx/html/static

COPY --from=build /app/dist /usr/share/nginx/html
COPY static/404.html /usr/share/nginx/html/static/404.html

# COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 443
CMD [ "nginx", "-g", "daemon off;" ]