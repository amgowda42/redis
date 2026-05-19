import express from "express";
import Redis from "ioredis";
import mongoose, { mongo } from "mongoose";

const app = express();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.get("/redis", async (req, res) => {
  const reply = await redis.ping();
  res.send({ redis: reply });
});

app.get("/mongo", async (req, res) => {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017/mongo-test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  res.send({ mongo: "connected", database: mongoose.connection.name });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
