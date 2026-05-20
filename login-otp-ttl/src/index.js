import express from "express";
import Redis from "ioredis";

const app = express();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.use(express.json());

function otpKey(phone) {
  return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(otpKey(phone), otp, "EX", 30);
  res.json({
    message: "OTP generated successfully",
    otp,
    success: true,
  });
});

app.post("/otp/verify", async (req, res) => {
  const savedOtp = await redis.get(otpKey(req.body.phone));

  if (!savedOtp) {
    return res.json({
      message: "OTP expired or not found",
      success: false,
    });
  }

  if (savedOtp !== req.body.otp) {
    return res.json({
      message: "Invalid OTP",
      success: false,
    });
  }

  await redis.del(otpKey(req.body.phone));

  res.json({
    message: "OTP verified successfully",
    success: true,
  });
});

app.get("/otp/:phone/ttl", async (req, res) => {
  const ttl = await redis.ttl(otpKey(req.params.phone));

  res.json({
    message: "OTP TTL retrieved successfully",
    ttl,
    success: true,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
