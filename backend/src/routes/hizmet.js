import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all hizmet
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      prisma.hizmet.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { hizmet_id: 'asc' }
      }),
      prisma.hizmet.count()
    ]);

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single hizmet
router.get('/:id', async (req, res) => {
  try {
    const hizmet = await prisma.hizmet.findUnique({
      where: { hizmet_id: parseInt(req.params.id) },
      include: { randevu: true }
    });
    if (!hizmet) return res.status(404).json({ error: 'Hizmet not found' });
    res.json(hizmet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create hizmet
router.post('/', async (req, res) => {
  try {
    const hizmet = await prisma.hizmet.create({ data: req.body });
    res.status(201).json(hizmet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update hizmet
router.put('/:id', async (req, res) => {
  try {
    const hizmet = await prisma.hizmet.update({
      where: { hizmet_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(hizmet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE hizmet
router.delete('/:id', async (req, res) => {
  try {
    await prisma.hizmet.delete({
      where: { hizmet_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Hizmet deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

