import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all masraf
router.get('/', async (req, res) => {
  try {
    const { sube_id, tarih_baslangic, tarih_bitis, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (sube_id) where.sube_id = parseInt(sube_id);
    if (tarih_baslangic || tarih_bitis) {
      where.tarih = {};
      if (tarih_baslangic) where.tarih.gte = new Date(tarih_baslangic);
      if (tarih_bitis) where.tarih.lte = new Date(tarih_bitis);
    }

    const [data, total] = await Promise.all([
      prisma.sube_masraf.findMany({
        where,
        include: { sube: true },
        skip,
        take: parseInt(limit),
        orderBy: { tarih: 'desc' }
      }),
      prisma.sube_masraf.count({ where })
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

// GET single masraf
router.get('/:id', async (req, res) => {
  try {
    const masraf = await prisma.sube_masraf.findUnique({
      where: { masraf_id: parseInt(req.params.id) },
      include: { sube: true }
    });
    if (!masraf) return res.status(404).json({ error: 'Masraf not found' });
    res.json(masraf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create masraf
router.post('/', async (req, res) => {
  try {
    const masraf = await prisma.sube_masraf.create({ data: req.body });
    res.status(201).json(masraf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update masraf
router.put('/:id', async (req, res) => {
  try {
    const masraf = await prisma.sube_masraf.update({
      where: { masraf_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(masraf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE masraf
router.delete('/:id', async (req, res) => {
  try {
    await prisma.sube_masraf.delete({
      where: { masraf_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Masraf deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

