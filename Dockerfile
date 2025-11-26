# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# copy package files from frontend and install
COPY frontend/package*.json ./
RUN npm ci --silent

# copy frontend source and build
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]