import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all sube
router.get('/', async (req, res) => {
  try {
    const [data] = await pool.execute(
      'SELECT * FROM sube ORDER BY sube_id ASC'
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching sube list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single sube
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sube WHERE sube_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Şube not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sube:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create sube
router.post('/', async (req, res) => {
  try {
    const { sube_ad, ilce_id, adres, telefon } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO sube (sube_ad, ilce_id, adres, telefon) VALUES (?, ?, ?, ?)',
      [sube_ad, ilce_id, adres, telefon]
    );

    const [newSube] = await pool.execute(
      'SELECT * FROM sube WHERE sube_id = ?',
      [result.insertId]
    );

    res.status(201).json(newSube[0]);
  } catch (error) {
    console.error('Error creating sube:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update sube
router.put('/:id', async (req, res) => {
  try {
    const { sube_ad, ilce_id, adres, telefon } = req.body;
    const sube_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE sube SET sube_ad = ?, ilce_id = ?, adres = ?, telefon = ? WHERE sube_id = ?',
      [sube_ad, ilce_id, adres, telefon, sube_id]
    );

    const [updatedSube] = await pool.execute(
      'SELECT * FROM sube WHERE sube_id = ?',
      [sube_id]
    );

    res.json(updatedSube[0]);
  } catch (error) {
    console.error('Error updating sube:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE sube
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM sube WHERE sube_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Şube not found' });
    }

    res.json({ message: 'Şube deleted successfully' });
  } catch (error) {
    console.error('Error deleting sube:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
