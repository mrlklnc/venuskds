import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all ilce
router.get('/', async (req, res) => {
  try {
    const [data] = await pool.execute(
      'SELECT * FROM ilce ORDER BY ilce_ad ASC'
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching ilce list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single ilce
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM ilce WHERE ilce_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'İlçe not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching ilce:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create ilce
router.post('/', async (req, res) => {
  try {
    const { ilce_ad } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO ilce (ilce_ad) VALUES (?)',
      [ilce_ad]
    );

    const [newIlce] = await pool.execute(
      'SELECT * FROM ilce WHERE ilce_id = ?',
      [result.insertId]
    );

    res.status(201).json(newIlce[0]);
  } catch (error) {
    console.error('Error creating ilce:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update ilce
router.put('/:id', async (req, res) => {
  try {
    const { ilce_ad } = req.body;
    const ilce_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE ilce SET ilce_ad = ? WHERE ilce_id = ?',
      [ilce_ad, ilce_id]
    );

    const [updatedIlce] = await pool.execute(
      'SELECT * FROM ilce WHERE ilce_id = ?',
      [ilce_id]
    );

    res.json(updatedIlce[0]);
  } catch (error) {
    console.error('Error updating ilce:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE ilce
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM ilce WHERE ilce_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'İlçe not found' });
    }

    res.json({ message: 'İlçe deleted successfully' });
  } catch (error) {
    console.error('Error deleting ilce:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
