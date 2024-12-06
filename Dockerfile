# Use the latest Node.js LTS version as the base image
FROM node:lts

# Set the working directory inside the container
WORKDIR /usr/src/app

RUN ls -l /usr/src/app

# Copy package.json and package-lock.json first for efficient caching
COPY package*.json ./

# Install dependencies
RUN npm install --include=dev

# Install nodemon globally
RUN npm install -g nodemon
RUN npm install -g tsx
RUN npm install -g reflect-metadata

# Copy the application source code
COPY . .

# Expose the application port
EXPOSE 3000

# Set the default environment variable
ENV NODE_ENV=development

# Start the application
CMD ["npm", "run", "dev"]
