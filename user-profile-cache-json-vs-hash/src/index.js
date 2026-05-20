// set -> single key value pair
// hash -> for objects with multiple fields and values
// hgetall -> to retrieve all fields and values of a hash
// hget -> to retrieve a specific field value from a hash
// hset -> to set a specific field value in a hash
// del -> to delete a key or hash from Redis
// expire -> to set an expiration time for a key or hash in Redis

import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.post("/user/:id/json", async (req, res) => {
  await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body));
  res.send("User profile cached as JSON");
});

app.get("/user/:id/json", async (req, res) => {
  const userProfile = await redis.get(`user:${req.params.id}:json`);
  res.json(JSON.parse(userProfile));
});

app.post("/user/:id/hash", async (req, res) => {
  await redis.hset(`user:${req.params.id}:hash`, req.body);
  res.send("User profile cached as hash");
});

app.get("/user/:id/hash", async (req, res) => {
  const userProfile = await redis.hgetall(`user:${req.params.id}:hash`);
  res.json(userProfile);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
