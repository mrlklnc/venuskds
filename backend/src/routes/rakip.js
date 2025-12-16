import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all rakip
router.get('/', async (req, res) => {
  try {
    const { ilce_id, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let query = 'SELECT * FROM rakip_isletme WHERE 1=1';
    const params = [];

    if (ilce_id) {
      query += ' AND ilce_id = ?';
      params.push(parseInt(ilce_id));
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Get paginated data
    query += ' ORDER BY rakip_id ASC LIMIT ? OFFSET ?';
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
    console.error('Error fetching rakip list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single rakip
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM rakip_isletme WHERE rakip_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rakip not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching rakip:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create rakip
router.post('/', async (req, res) => {
  try {
    const { rakip_ad, ilce_id, adres, telefon } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO rakip_isletme (rakip_ad, ilce_id, adres, telefon) VALUES (?, ?, ?, ?)',
      [rakip_ad, ilce_id, adres, telefon]
    );

    const [newRakip] = await pool.execute(
      'SELECT * FROM rakip_isletme WHERE rakip_id = ?',
      [result.insertId]
    );

    res.status(201).json(newRakip[0]);
  } catch (error) {
    console.error('Error creating rakip:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update rakip
router.put('/:id', async (req, res) => {
  try {
    const { rakip_ad, ilce_id, adres, telefon } = req.body;
    const rakip_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE rakip_isletme SET rakip_ad = ?, ilce_id = ?, adres = ?, telefon = ? WHERE rakip_id = ?',
      [rakip_ad, ilce_id, adres, telefon, rakip_id]
    );

    const [updatedRakip] = await pool.execute(
      'SELECT * FROM rakip_isletme WHERE rakip_id = ?',
      [rakip_id]
    );

    res.json(updatedRakip[0]);
  } catch (error) {
    console.error('Error updating rakip:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE rakip
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM rakip_isletme WHERE rakip_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rakip not found' });
    }

    res.json({ message: 'Rakip deleted successfully' });
  } catch (error) {
    console.error('Error deleting rakip:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
