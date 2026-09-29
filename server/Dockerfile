# ── Imagen base ───────────────────────────────────────────────────────────────
FROM node:20-alpine

# Instalar dependencias del sistema necesarias para bcrypt y pg
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar manifiestos primero (aprovecha cache de Docker)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

EXPOSE 3002

CMD ["node", "index.js"]
