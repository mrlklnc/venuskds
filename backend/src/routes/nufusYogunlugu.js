import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

/**
 * GET /api/nufus-yogunlugu
 * 
 * Nüfus yoğunluğu verisini döndürür (ilçe bazlı)
 * 
 * Döndürür:
 * [
 *   { "label": "Konak", "value": 12345.67 },
 *   ...
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.ilce_ad AS label, id.nufus_yogunlugu AS value
      FROM ilce i
      JOIN ilce_demografi id ON id.ilce_id = i.ilce_id
      ORDER BY id.nufus_yogunlugu DESC
    `);

    const formattedData = rows.map(item => ({
      label: item.label || '',
      value: Number(item.value) || 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('❌ Nüfus yoğunluğu hatası:', error);
    res.status(500).json({ 
      error: 'Nüfus yoğunluğu verisi alınamadı',
      message: error.message 
    });
  }
});

export default router;

