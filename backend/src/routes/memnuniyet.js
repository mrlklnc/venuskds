import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all memnuniyet
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM memnuniyet');
    const total = countRows[0].total;

    // Get paginated data
    const [data] = await pool.execute(
      'SELECT * FROM memnuniyet ORDER BY tarih DESC LIMIT ? OFFSET ?',
      [take, skip]
    );

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
    console.error('Error fetching memnuniyet list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single memnuniyet
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM memnuniyet WHERE memnuniyet_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Memnuniyet not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching memnuniyet:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create memnuniyet
router.post('/', async (req, res) => {
  try {
    const { randevu_id, musteri_id, puan, yorum, tarih } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO memnuniyet (randevu_id, musteri_id, puan, yorum, tarih) VALUES (?, ?, ?, ?, ?)',
      [randevu_id, musteri_id, puan, yorum, tarih]
    );

    const [newMemnuniyet] = await pool.execute(
      'SELECT * FROM memnuniyet WHERE memnuniyet_id = ?',
      [result.insertId]
    );

    res.status(201).json(newMemnuniyet[0]);
  } catch (error) {
    console.error('Error creating memnuniyet:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update memnuniyet
router.put('/:id', async (req, res) => {
  try {
    const { randevu_id, musteri_id, puan, yorum, tarih } = req.body;
    const memnuniyet_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE memnuniyet SET randevu_id = ?, musteri_id = ?, puan = ?, yorum = ?, tarih = ? WHERE memnuniyet_id = ?',
      [randevu_id, musteri_id, puan, yorum, tarih, memnuniyet_id]
    );

    const [updatedMemnuniyet] = await pool.execute(
      'SELECT * FROM memnuniyet WHERE memnuniyet_id = ?',
      [memnuniyet_id]
    );

    res.json(updatedMemnuniyet[0]);
  } catch (error) {
    console.error('Error updating memnuniyet:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE memnuniyet
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM memnuniyet WHERE memnuniyet_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Memnuniyet not found' });
    }

    res.json({ message: 'Memnuniyet deleted successfully' });
  } catch (error) {
    console.error('Error deleting memnuniyet:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
