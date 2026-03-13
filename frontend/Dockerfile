# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock* ./
RUN corepack enable \
  && corepack prepare yarn@1.22.22 --activate \
  && yarn install --non-interactive

COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
RUN yarn build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN cat <<'NGINX_CONF' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
NGINX_CONF

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
