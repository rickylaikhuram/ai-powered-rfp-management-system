import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chat from "./routes/chat";
import "./jobs/cronjob.services";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Check if user is logged in
app.use("/api/chat", chat);


app.get("/health", (req, res) => {
  res.status(200).send("Backend service healthy - " + new Date().toISOString());
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
