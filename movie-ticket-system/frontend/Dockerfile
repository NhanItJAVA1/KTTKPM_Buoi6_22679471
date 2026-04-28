FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_USER_SERVICE_URL=http://localhost:8081
ARG VITE_MOVIE_SERVICE_URL=http://localhost:8082
ARG VITE_BOOKING_SERVICE_URL=http://localhost:8083
ENV VITE_USER_SERVICE_URL=$VITE_USER_SERVICE_URL
ENV VITE_MOVIE_SERVICE_URL=$VITE_MOVIE_SERVICE_URL
ENV VITE_BOOKING_SERVICE_URL=$VITE_BOOKING_SERVICE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8085
CMD ["nginx", "-g", "daemon off;"]
