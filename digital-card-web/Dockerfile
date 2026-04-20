FROM node:20-alpine AS build
WORKDIR /app

# Cache deps separately
COPY package.json package-lock.json ./
RUN npm ci

# Copy only what's required to build the SPA — avoid `COPY . .` so secrets,
# local editor state or CI files can never slip into the image.
COPY angular.json tsconfig.json tsconfig.app.json ngsw-config.json ./
COPY tailwind.config.js postcss.config.js ./
COPY src ./src

RUN npm run build -- --configuration production

# -- Runtime stage: nginx-unprivileged (UID 101, listens on 8080, no root) --
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/digital-card-web/browser /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
