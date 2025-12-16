import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pool from "./lib/db.js";

// Routes
import musteriRoutes from "./routes/musteri.js";
import randevuRoutes from "./routes/randevu.js";
import hizmetRoutes from "./routes/hizmet.js";
import ilceRoutes from "./routes/ilce.js";
import kampanyaRoutes from "./routes/kampanya.js";
import memnuniyetRoutes from "./routes/memnuniyet.js";
import masrafRoutes from "./routes/masraf.js";
import rakipRoutes from "./routes/rakip.js";
import subeRoutes from "./routes/sube.js";
import dssRoutes from "./routes/dssRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analizlerRoutes from "./routes/analizlerRoutes.js";
import simulasyonRoutes from "./routes/simulasyonRoutes.js";

const app = express();

/* 🔴 PORT NET VE TEK */
const PORT = 4000;

/* 🔴 CORS – SADE, NET, SORUNSUZ */
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

/* ROUTES */
app.use("/api/musteri", musteriRoutes);
app.use("/api/randevu", randevuRoutes);
app.use("/api/hizmet", hizmetRoutes);
app.use("/api/ilce", ilceRoutes);
app.use("/api/kampanya", kampanyaRoutes);
app.use("/api/memnuniyet", memnuniyetRoutes);
app.use("/api/masraf", masrafRoutes);
app.use("/api/rakip", rakipRoutes);
app.use("/api/sube", subeRoutes);
app.use("/api/dss", dssRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analizler", analizlerRoutes);
app.use("/api/simulasyon", simulasyonRoutes);

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
