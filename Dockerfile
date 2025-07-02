# Usa una imagen oficial de Node.js como base
FROM node:20.18

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Expone el puerto 3403
EXPOSE 3403

# Comando por defecto para ejecutar la aplicación
CMD ["npm", "run", "start"]