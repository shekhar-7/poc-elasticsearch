// src/utils/broker/redis-client.ts

import { createClient } from 'redis';

// Create a Redis client
const redisClient = createClient({
  url: 'redis://localhost:6379', // Redis server URL
  // password: 'your_password', // Uncomment if your Redis server requires a password
});

// Connect to Redis
redisClient.connect().catch(console.error);


// Export the client for use in other parts of your application
export default redisClient;