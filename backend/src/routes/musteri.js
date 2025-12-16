import express from "express";
import pool from "../lib/db.js";

const router = express.Router();

/**
 * GET /api/musteri
 * Tüm müşterileri listeler
 * Opsiyonel filtre: ilce_id
 * Sayfalama: page, limit
 */
router.get("/", async (req, res) => {
  try {
    const { ilce_id, page = 1, limit = 50 } = req.query;

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (currentPage - 1) * pageLimit;

    let baseQuery = "FROM musteri WHERE 1=1";
    const params = [];

    if (ilce_id) {
      baseQuery += " AND ilce_id = ?";
      params.push(parseInt(ilce_id));
    }

    // Toplam kayıt sayısı
    const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Veri sorgusu
    const dataSql = `
      SELECT *
      ${baseQuery}
      ORDER BY musteri_id DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, pageLimit, offset];
    const [rows] = await pool.query(dataSql, dataParams);

    res.json({
      data: rows,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Müşteri listesi hatası:", error);
    res.status(500).json({
      error: "Müşteri listesi alınırken hata oluştu",
      message: error.message,
    });
  }
});

/**
 * GET /api/musteri/:id
 * Tek müşteri getir
 */
router.get("/:id", async (req, res) => {
  try {
    const musteriId = parseInt(req.params.id);

    const [rows] = await pool.query(
      "SELECT * FROM musteri WHERE musteri_id = ?",
      [musteriId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Müşteri bulunamadı" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Müşteri getirme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/musteri
 * Yeni müşteri ekle
 */
router.post("/", async (req, res) => {
  try {
    const { ad, soyad, telefon, ilce_id, dogum_tarihi, yas } = req.body;

    const [result] = await pool.query(
      `
      INSERT INTO musteri (ad, soyad, telefon, ilce_id, dogum_tarihi, yas)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [ad, soyad, telefon, ilce_id, dogum_tarihi, yas]
    );

    const [rows] = await pool.query(
      "SELECT * FROM musteri WHERE musteri_id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Müşteri ekleme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/musteri/:id
 * Müşteri güncelle
 */
router.put("/:id", async (req, res) => {
  try {
    const musteriId = parseInt(req.params.id);
    const { ad, soyad, telefon, ilce_id, dogum_tarihi, yas } = req.body;

    await pool.query(
      `
      UPDATE musteri
      SET ad = ?, soyad = ?, telefon = ?, ilce_id = ?, dogum_tarihi = ?, yas = ?
      WHERE musteri_id = ?
      `,
      [ad, soyad, telefon, ilce_id, dogum_tarihi, yas, musteriId]
    );

    const [rows] = await pool.query(
      "SELECT * FROM musteri WHERE musteri_id = ?",
      [musteriId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Müşteri güncelleme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/musteri/:id
 * Müşteri sil
 */
router.delete("/:id", async (req, res) => {
  try {
    const musteriId = parseInt(req.params.id);

    const [result] = await pool.query(
      "DELETE FROM musteri WHERE musteri_id = ?",
      [musteriId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Müşteri bulunamadı" });
    }

    res.json({ message: "Müşteri başarıyla silindi" });
  } catch (error) {
    console.error("Müşteri silme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

