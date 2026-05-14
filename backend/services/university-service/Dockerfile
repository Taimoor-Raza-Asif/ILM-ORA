FROM node:18-alpine

WORKDIR /app

# Build from repo root with: docker build -f backend/services/university-service/Dockerfile backend
COPY services/university-service/package*.json ./

RUN npm install --omit=dev

COPY services/university-service/ ./
COPY shared /shared

ENV SCHOLARSHIP_MAPPER_URL=file:///shared/utils/scholarshipMapper.js

EXPOSE 3005

CMD ["npm", "run", "start"]
