# FROM node:16-alpine as build

# WORKDIR /app

# COPY package.json package.json
# RUN npm install

# COPY . .
# RUN npm run build

# FROM nginx:stable-alpine

# RUN mkdir -p /usr/share/nginx/html/static

# COPY --from=build /app/dist /usr/share/nginx/html
# # COPY static/index.html /usr/share/nginx/html/static/index.html

# COPY static/404.html /usr/share/nginx/html/static/404.html

# RUN chmod 644 /usr/share/nginx/html/static/404.html && \
#     chown root:root /usr/share/nginx/html/static/404.html

# # COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf


# EXPOSE 443
# CMD [ "nginx", "-g", "daemon off;" ]


# Stage 1: Build the React application
FROM node:16-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Verify the build output
RUN ls -l /app/build

# Stage 2: Serve the React application with Nginx
FROM nginx:stable-alpine

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/static

# Copy the built files to the Nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy the 404.html file to the Nginx html directory
COPY static/404.html /usr/share/nginx/html/404.html

# Set the correct permissions and ownership for the 404.html file
RUN chmod 644 /usr/share/nginx/html/404.html && \
    chown root:root /usr/share/nginx/html/404.html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 443
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]