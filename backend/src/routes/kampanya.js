import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all kampanya
router.get('/', async (req, res) => {
  try {
    const kampanya = await prisma.kampanya.findMany({
      orderBy: { baslangic: 'desc' },
      include: { randevu: true }
    });
    res.json(kampanya);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single kampanya
router.get('/:id', async (req, res) => {
  try {
    const kampanya = await prisma.kampanya.findUnique({
      where: { kampanya_id: parseInt(req.params.id) },
      include: { randevu: true }
    });
    if (!kampanya) return res.status(404).json({ error: 'Kampanya not found' });
    res.json(kampanya);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create kampanya
router.post('/', async (req, res) => {
  try {
    const kampanya = await prisma.kampanya.create({ data: req.body });
    res.status(201).json(kampanya);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update kampanya
router.put('/:id', async (req, res) => {
  try {
    const kampanya = await prisma.kampanya.update({
      where: { kampanya_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(kampanya);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE kampanya
router.delete('/:id', async (req, res) => {
  try {
    await prisma.kampanya.delete({
      where: { kampanya_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Kampanya deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

