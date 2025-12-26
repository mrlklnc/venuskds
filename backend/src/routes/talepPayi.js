import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

/**
 * GET /api/talep-payi
 * 
 * Talep payı verisini döndürür (ilçe bazlı, yüzdelik)
 * 
 * Döndürür:
 * [
 *   { "label": "Konak", "value": 22.5 },
 *   ...
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.ilce_ad AS label,
        ROUND(
          (COUNT(r.randevu_id) * 100.0) / 
          (SELECT COUNT(*) FROM randevu),
        2) AS value
      FROM ilce i
      JOIN musteri m ON m.ilce_id = i.ilce_id
      JOIN randevu r ON r.musteri_id = m.musteri_id
      GROUP BY i.ilce_id, i.ilce_ad
      ORDER BY value DESC
      LIMIT 5
    `);

    const formattedData = rows.map(item => ({
      label: item.label || '',
      value: Number(item.value) || 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('❌ Talep payı hatası:', error);
    res.status(500).json({ 
      error: 'Talep payı verisi alınamadı',
      message: error.message 
    });
  }
});

export default router;

