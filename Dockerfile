FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install

# Copiar todo el código
COPY . .

# Generar el cliente de Prisma para que esté listo en la imagen
RUN npx prisma generate

# Exponer el puerto del Backend
EXPOSE 3000

# Ejecutar las migraciones de base de datos y el seeder antes de iniciar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
