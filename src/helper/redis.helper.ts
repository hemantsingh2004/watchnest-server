import redis from "redis";

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Redis client connected successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
};

const disconnectRedis = async () => {
  try {
    await client.quit();
    console.log("Redis client disconnected successfully");
  } catch (err) {
    console.error("Failed to disconnect from Redis:", err);
  }
};

const setJWT = async (key: string, value: string) => {
  try {
    const res = await client.set(key, value, { EX: 60 * 60 });
    return res;
  } catch (err) {
    throw err;
  }
};

const getJWT = async (key: string) => {
  try {
    const res = await client.get(key);
    return res;
  } catch (err) {
    throw err;
  }
};

const deleteJWT = async (key: string) => {
  try {
    const res = await client.del(key);
    return res;
  } catch (err) {
    throw err;
  }
};

export { connectRedis, disconnectRedis, setJWT, getJWT, deleteJWT };
