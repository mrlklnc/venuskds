import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// GET all memnuniyet
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      prisma.memnuniyet.findMany({
        include: {
          randevu: {
            include: {
              hizmet: true,
              musteri: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { tarih: 'desc' }
      }),
      prisma.memnuniyet.count()
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

// GET single memnuniyet
router.get('/:id', async (req, res) => {
  try {
    const memnuniyet = await prisma.memnuniyet.findUnique({
      where: { memnuniyet_id: parseInt(req.params.id) },
      include: {
        randevu: {
          include: {
            hizmet: true,
            musteri: true
          }
        }
      }
    });
    if (!memnuniyet) return res.status(404).json({ error: 'Memnuniyet not found' });
    res.json(memnuniyet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create memnuniyet
router.post('/', async (req, res) => {
  try {
    const memnuniyet = await prisma.memnuniyet.create({ data: req.body });
    res.status(201).json(memnuniyet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update memnuniyet
router.put('/:id', async (req, res) => {
  try {
    const memnuniyet = await prisma.memnuniyet.update({
      where: { memnuniyet_id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(memnuniyet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE memnuniyet
router.delete('/:id', async (req, res) => {
  try {
    await prisma.memnuniyet.delete({
      where: { memnuniyet_id: parseInt(req.params.id) }
    });
    res.json({ message: 'Memnuniyet deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

