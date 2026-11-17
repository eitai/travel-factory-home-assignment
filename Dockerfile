FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

FROM dependencies AS api
COPY tsconfig.base.json ./
COPY shared shared
COPY backend backend
WORKDIR /app/backend
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]

FROM dependencies AS web-build
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY tsconfig.base.json ./
COPY shared shared
COPY frontend frontend
RUN npm run build -w frontend

FROM nginx:1.29-alpine AS web
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
