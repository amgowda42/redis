import express from "express";
import Redis from "ioredis";

const app = express();

const publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.use(express.json());

app.post("/notifications", async (req, res) => {
  const payload = {
    title: req.body.title || "Default Title",
    message: req.body.message || "Default Message",
    timestamp: new Date().toISOString(),
  };

  const recivers = await publisher.publish(
    "notifications",
    JSON.stringify(payload),
  );
  console.log(`Published notification to ${recivers} subscribers`);
});

app.listen(3000, () => {
  console.log("Notification publisher is running on port 3000");
});
