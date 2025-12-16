import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all hizmet
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM hizmet');
    const total = countRows[0].total;

    // Get paginated data
    const [data] = await pool.execute(
      'SELECT * FROM hizmet ORDER BY hizmet_id ASC LIMIT ? OFFSET ?',
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
    console.error('Error fetching hizmet list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single hizmet
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM hizmet WHERE hizmet_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hizmet not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching hizmet:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create hizmet
router.post('/', async (req, res) => {
  try {
    const { hizmet_ad, fiyat_araligi } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO hizmet (hizmet_ad, fiyat_araligi) VALUES (?, ?)',
      [hizmet_ad, fiyat_araligi]
    );

    const [newHizmet] = await pool.execute(
      'SELECT * FROM hizmet WHERE hizmet_id = ?',
      [result.insertId]
    );

    res.status(201).json(newHizmet[0]);
  } catch (error) {
    console.error('Error creating hizmet:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update hizmet
router.put('/:id', async (req, res) => {
  try {
    const { hizmet_ad, fiyat_araligi } = req.body;
    const hizmet_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE hizmet SET hizmet_ad = ?, fiyat_araligi = ? WHERE hizmet_id = ?',
      [hizmet_ad, fiyat_araligi, hizmet_id]
    );

    const [updatedHizmet] = await pool.execute(
      'SELECT * FROM hizmet WHERE hizmet_id = ?',
      [hizmet_id]
    );

    res.json(updatedHizmet[0]);
  } catch (error) {
    console.error('Error updating hizmet:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE hizmet
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM hizmet WHERE hizmet_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hizmet not found' });
    }

    res.json({ message: 'Hizmet deleted successfully' });
  } catch (error) {
    console.error('Error deleting hizmet:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
