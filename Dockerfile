# Use the official Node.js image
FROM node:22-alpine

# Install PostgreSQL client tools and necessary build tools
RUN apk add --no-cache postgresql-client

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Create a startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Use the startup script as the entrypoint
ENTRYPOINT ["/start.sh"]