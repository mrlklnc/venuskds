import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all ilce
router.get('/', async (req, res) => {
  try {
    const ilce = await prisma.ilce.findMany({
      orderBy: { ilce_ad: 'asc' }
    });
    res.json(ilce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ilce
router.get('/:id', async (req, res) => {
  try {
    const ilce = await prisma.ilce.findUnique({
      where: { ilce_id: parseInt(req.params.id) },
      include: {
        musteri: true,
        rakip_isletme: true,
        sube: true
      }
    });
    if (!ilce) return res.status(404).json({ error: 'İlçe not found' });
    res.json(ilce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create ilce
router.post('/', async (req, res) => {
  try {
    const ilce = await prisma.ilce.create({ data: req.body });
    res.status(201).json(ilce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update ilce
router.put('/:id', async (req, res) => {
  try {
    const ilce = await prisma.ilce.update({
      where: { ilce_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(ilce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ilce
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ilce.delete({
      where: { ilce_id: parseInt(req.params.id) }
    });
    res.json({ message: 'İlçe deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

