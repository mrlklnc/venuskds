import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

// GET all kampanya
router.get('/', async (req, res) => {
  try {
    const [data] = await pool.execute(
      'SELECT * FROM kampanya ORDER BY baslangic DESC'
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching kampanya list:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single kampanya
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM kampanya WHERE kampanya_id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kampanya not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching kampanya:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create kampanya
router.post('/', async (req, res) => {
  try {
    const { kampanya_ad, aciklama, hizmet_id, indirim_orani, baslangic, bitis } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO kampanya (kampanya_ad, aciklama, hizmet_id, indirim_orani, baslangic, bitis) VALUES (?, ?, ?, ?, ?, ?)',
      [kampanya_ad, aciklama, hizmet_id, indirim_orani, baslangic, bitis]
    );

    const [newKampanya] = await pool.execute(
      'SELECT * FROM kampanya WHERE kampanya_id = ?',
      [result.insertId]
    );

    res.status(201).json(newKampanya[0]);
  } catch (error) {
    console.error('Error creating kampanya:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update kampanya
router.put('/:id', async (req, res) => {
  try {
    const { kampanya_ad, aciklama, hizmet_id, indirim_orani, baslangic, bitis } = req.body;
    const kampanya_id = parseInt(req.params.id);

    await pool.execute(
      'UPDATE kampanya SET kampanya_ad = ?, aciklama = ?, hizmet_id = ?, indirim_orani = ?, baslangic = ?, bitis = ? WHERE kampanya_id = ?',
      [kampanya_ad, aciklama, hizmet_id, indirim_orani, baslangic, bitis, kampanya_id]
    );

    const [updatedKampanya] = await pool.execute(
      'SELECT * FROM kampanya WHERE kampanya_id = ?',
      [kampanya_id]
    );

    res.json(updatedKampanya[0]);
  } catch (error) {
    console.error('Error updating kampanya:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE kampanya
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM kampanya WHERE kampanya_id = ?',
      [parseInt(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kampanya not found' });
    }

    res.json({ message: 'Kampanya deleted successfully' });
  } catch (error) {
    console.error('Error deleting kampanya:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
