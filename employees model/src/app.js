import express from "express";
import employeeRoutes from "./routes/employee.js";

const app = express();

app.use(express.json());

app.use("/api", employeeRoutes);

export default app;
