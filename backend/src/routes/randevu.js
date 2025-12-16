import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all randevu with optional filters
router.get('/', async (req, res) => {
  try {
    const { 
      musteri_id, 
      hizmet_id, 
      tarih_baslangic, 
      tarih_bitis,
      page = 1, 
      limit = 50 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let query = 'SELECT * FROM randevu WHERE 1=1';
    const params = [];

    if (musteri_id) {
      query += ' AND musteri_id = ?';
      params.push(parseInt(musteri_id));
    }

    if (hizmet_id) {
      query += ' AND hizmet_id = ?';
      params.push(parseInt(hizmet_id));
    }

    if (tarih_baslangic) {
      query += ' AND tarih >= ?';
      params.push(tarih_baslangic);
    }

    if (tarih_bitis) {
      query += ' AND tarih <= ?';
      params.push(tarih_bitis);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Get paginated data
    query += ' ORDER BY tarih DESC LIMIT ? OFFSET ?';
    params.push(take, skip);

    const [data] = await pool.execute(query, params);

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching randevu list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single randevu
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM randevu WHERE randevu_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Randevu not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching randevu:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create randevu
router.post('/', async (req, res) => {
  try {
    const { musteri_id, hizmet_id, tarih, fiyat, kampanya_id } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO randevu (musteri_id, hizmet_id, tarih, fiyat, kampanya_id) VALUES (?, ?, ?, ?, ?)',
      [musteri_id, hizmet_id, tarih, fiyat, kampanya_id]
    );

    const [newRandevu] = await pool.execute(
      'SELECT * FROM randevu WHERE randevu_id = ?',
      [result.insertId]
    );

    res.status(201).json(newRandevu[0]);
  } catch (error) {
    console.error('Error creating randevu:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update randevu
router.put('/:id', async (req, res) => {
  try {
    const { musteri_id, hizmet_id, tarih, fiyat, kampanya_id } = req.body;
    const randevu_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE randevu SET musteri_id = ?, hizmet_id = ?, tarih = ?, fiyat = ?, kampanya_id = ? WHERE randevu_id = ?',
      [musteri_id, hizmet_id, tarih, fiyat, kampanya_id, randevu_id]
    );

    const [updatedRandevu] = await pool.execute(
      'SELECT * FROM randevu WHERE randevu_id = ?',
      [randevu_id]
    );

    res.json(updatedRandevu[0]);
  } catch (error) {
    console.error('Error updating randevu:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE randevu
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM randevu WHERE randevu_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Randevu not found' });
    }

    res.json({ message: 'Randevu deleted successfully' });
  } catch (error) {
    console.error('Error deleting randevu:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
