# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json /app/package.json
RUN corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --non-interactive

COPY . /app
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
RUN yarn build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
CMD ["sh", "-c", "sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
