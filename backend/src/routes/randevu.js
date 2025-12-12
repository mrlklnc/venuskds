import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all randevu with optional filters
router.get('/', async (req, res) => {
  try {
    const { 
      musteri_id, 
      hizmet_id, 
      tarih_baslangic, 
      tarih_bitis,
      page = 1, 
      limit = 50 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (musteri_id) where.musteri_id = parseInt(musteri_id);
    if (hizmet_id) where.hizmet_id = parseInt(hizmet_id);
    if (tarih_baslangic || tarih_bitis) {
      where.tarih = {};
      if (tarih_baslangic) where.tarih.gte = new Date(tarih_baslangic);
      if (tarih_bitis) where.tarih.lte = new Date(tarih_bitis);
    }

    const [data, total] = await Promise.all([
      prisma.randevu.findMany({
        where,
        include: {
          musteri: { include: { ilce: true } },
          hizmet: true,
          kampanya: true,
          memnuniyet: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { tarih: 'desc' }
      }),
      prisma.randevu.count({ where })
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

// GET single randevu
router.get('/:id', async (req, res) => {
  try {
    const randevu = await prisma.randevu.findUnique({
      where: { randevu_id: parseInt(req.params.id) },
      include: {
        musteri: { include: { ilce: true } },
        hizmet: true,
        kampanya: true,
        memnuniyet: true
      }
    });
    if (!randevu) return res.status(404).json({ error: 'Randevu not found' });
    res.json(randevu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create randevu
router.post('/', async (req, res) => {
  try {
    const randevu = await prisma.randevu.create({ data: req.body });
    res.status(201).json(randevu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update randevu
router.put('/:id', async (req, res) => {
  try {
    const randevu = await prisma.randevu.update({
      where: { randevu_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(randevu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE randevu
router.delete('/:id', async (req, res) => {
  try {
    await prisma.randevu.delete({
      where: { randevu_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Randevu deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

