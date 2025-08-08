FROM node:18

# Cài libaio (phụ thuộc của Oracle client)
RUN apt-get update && apt-get install -y libaio1

# Làm việc trong thư mục /app
WORKDIR /app

# Copy code và cài node_modules
COPY package*.json ./
RUN npm install
COPY . .

# Chạy app
CMD ["npm", "start"]
