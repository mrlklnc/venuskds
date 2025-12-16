import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all masraf
router.get('/', async (req, res) => {
  try {
    const { sube_id, ay, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let query = 'SELECT * FROM masraf WHERE 1=1';
    const params = [];

    if (sube_id) {
      query += ' AND sube_id = ?';
      params.push(parseInt(sube_id));
    }

    if (ay) {
      query += ' AND ay = ?';
      params.push(ay);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Get paginated data
    query += ' ORDER BY ay DESC LIMIT ? OFFSET ?';
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
    console.error('Error fetching masraf list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single masraf
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM masraf WHERE masraf_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Masraf not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching masraf:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create masraf
router.post('/', async (req, res) => {
  try {
    const { sube_id, ay, kira, maas, elektrik, su, diger } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO masraf (sube_id, ay, kira, maas, elektrik, su, diger) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sube_id, ay, kira, maas, elektrik, su, diger]
    );

    const [newMasraf] = await pool.execute(
      'SELECT * FROM masraf WHERE masraf_id = ?',
      [result.insertId]
    );

    res.status(201).json(newMasraf[0]);
  } catch (error) {
    console.error('Error creating masraf:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update masraf
router.put('/:id', async (req, res) => {
  try {
    const { sube_id, ay, kira, maas, elektrik, su, diger } = req.body;
    const masraf_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE masraf SET sube_id = ?, ay = ?, kira = ?, maas = ?, elektrik = ?, su = ?, diger = ? WHERE masraf_id = ?',
      [sube_id, ay, kira, maas, elektrik, su, diger, masraf_id]
    );

    const [updatedMasraf] = await pool.execute(
      'SELECT * FROM masraf WHERE masraf_id = ?',
      [masraf_id]
    );

    res.json(updatedMasraf[0]);
  } catch (error) {
    console.error('Error updating masraf:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE masraf
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM masraf WHERE masraf_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Masraf not found' });
    }

    res.json({ message: 'Masraf deleted successfully' });
  } catch (error) {
    console.error('Error deleting masraf:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
