import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pool from "./lib/db.js";

// 🔴 APP HER ŞEYDEN ÖNCE
const app = express();

// 🔴 ROUTES (index.js)
import routes from "./routes/index.js";

/* 🔴 PORT */
const PORT = 4000;

/* 🔴 CORS */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/* ROOT */
app.get("/", (req, res) => {
  res.send("Venus Beauty Salon DSS API is running 💖");
});

/* 🔴 TÜM ROUTE'LAR TEK YERDEN */
app.use("/api", routes);

/* HEALTH CHECK */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: "connected" });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(500).json({
    error: "Server error",
    message: err.message,
  });
});

/* DB TEST */
async function testDatabaseConnection() {
  try {
    await pool.execute("SELECT 1");
    console.log("✅ MySQL bağlantısı başarılı");
  } catch (error) {
    console.error("❌ MySQL bağlantı hatası:", error.message);
  }
}

/* START */
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testDatabaseConnection();
});
