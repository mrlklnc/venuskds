import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all rakip
router.get('/', async (req, res) => {
  try {
    const { ilce_id, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (ilce_id) where.ilce_id = parseInt(ilce_id);

    const [data, total] = await Promise.all([
      prisma.rakip_isletme.findMany({
        where,
        include: { ilce: true },
        skip,
        take: parseInt(limit),
        orderBy: { rakip_id: 'asc' }
      }),
      prisma.rakip_isletme.count({ where })
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

// GET single rakip
router.get('/:id', async (req, res) => {
  try {
    const rakip = await prisma.rakip_isletme.findUnique({
      where: { rakip_id: parseInt(req.params.id) },
      include: { ilce: true }
    });
    if (!rakip) return res.status(404).json({ error: 'Rakip not found' });
    res.json(rakip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create rakip
router.post('/', async (req, res) => {
  try {
    const rakip = await prisma.rakip_isletme.create({ data: req.body });
    res.status(201).json(rakip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update rakip
router.put('/:id', async (req, res) => {
  try {
    const rakip = await prisma.rakip_isletme.update({
      where: { rakip_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(rakip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE rakip
router.delete('/:id', async (req, res) => {
  try {
    await prisma.rakip_isletme.delete({
      where: { rakip_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Rakip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

