import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all sube
router.get('/', async (req, res) => {
  try {
    const subeler = await prisma.sube.findMany({
      include: { ilce: true },
      orderBy: { sube_id: 'asc' }
    });
    res.json(subeler);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single sube
router.get('/:id', async (req, res) => {
  try {
    const sube = await prisma.sube.findUnique({
      where: { sube_id: parseInt(req.params.id) },
      include: { ilce: true, sube_masraf: true }
    });
    if (!sube) return res.status(404).json({ error: 'Şube not found' });
    res.json(sube);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create sube
router.post('/', async (req, res) => {
  try {
    const sube = await prisma.sube.create({ data: req.body });
    res.status(201).json(sube);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update sube
router.put('/:id', async (req, res) => {
  try {
    const sube = await prisma.sube.update({
      where: { sube_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(sube);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE sube
router.delete('/:id', async (req, res) => {
  try {
    await prisma.sube.delete({
      where: { sube_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Şube deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

