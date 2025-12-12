import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all musteri with optional filters
router.get('/', async (req, res) => {
  try {
    const { ilce_id, segment, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (ilce_id) where.ilce_id = parseInt(ilce_id);
    if (segment) where.segment = segment;

    const [data, total] = await Promise.all([
      prisma.musteri.findMany({
        where,
        include: { ilce: true },
        skip,
        take: parseInt(limit),
        orderBy: { musteri_id: 'desc' }
      }),
      prisma.musteri.count({ where })
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

// GET single musteri
router.get('/:id', async (req, res) => {
  try {
    const musteri = await prisma.musteri.findUnique({
      where: { musteri_id: parseInt(req.params.id) },
      include: { ilce: true, randevu: { include: { hizmet: true } } }
    });
    if (!musteri) return res.status(404).json({ error: 'Müşteri not found' });
    res.json(musteri);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create musteri
router.post('/', async (req, res) => {
  try {
    const musteri = await prisma.musteri.create({ data: req.body });
    res.status(201).json(musteri);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update musteri
router.put('/:id', async (req, res) => {
  try {
    const musteri = await prisma.musteri.update({
      where: { musteri_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(musteri);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE musteri
router.delete('/:id', async (req, res) => {
  try {
    await prisma.musteri.delete({
      where: { musteri_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Müşteri deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

