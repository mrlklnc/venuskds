import express from "express";
import pool from "../lib/db.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const [musteriRows] = await pool.query(
      "SELECT COUNT(*) AS toplamMusteri FROM musteri WHERE is_test = 0"
    );

    const [randevuRows] = await pool.query(
      "SELECT COUNT(*) AS toplamRandevu FROM randevu r JOIN musteri m ON r.musteri_id = m.musteri_id WHERE m.is_test = 0"
    );

    const [gelirRows] = await pool.query(
      "SELECT IFNULL(SUM(ucret), 0) AS toplamGelir FROM randevu r JOIN musteri m ON r.musteri_id = m.musteri_id WHERE m.is_test = 0"
    );

    res.json({
      toplamMusteri: musteriRows[0]?.toplamMusteri || 0,
      toplamRandevu: randevuRows[0]?.toplamRandevu || 0,
      toplamGelir: gelirRows[0]?.toplamGelir || 0,
    });
  } catch (err) {
    console.error("❌ Dashboard summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;



