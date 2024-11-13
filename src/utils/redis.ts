import Redis from "ioredis";

const redisClient = () => {
    if (!process.env.REDIS_URL) {
        throw new Error("REDIS_URL not found");
    }
    return process.env.REDIS_URL;
}

export const redis = new Redis(redisClient());