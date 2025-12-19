import pool from '../lib/db.js';

/**
 * Dashboard Ana Endpoint
 * GET /api/dashboard
 * 
 * Döndürür:
 * - totalMusteri: Toplam müşteri sayısı
 * - totalRandevu: Toplam randevu sayısı
 * - toplamGelir: Tahmini toplam gelir (hizmet.fiyat_araligi ortalaması üzerinden)
 * - ortalamaRandevu: Randevu başına ortalama gelir
 * 
 * Fiyat Hesaplama:
 * - hizmet.fiyat_araligi formatı: "800-1500 TL"
 * - Hesaplama: (min + max) / 2
 * - NULL değerler 0 kabul edilir
 */
export const getDashboard = async (req, res) => {
  try {
    // 1. Toplam Müşteri Sayısı
    const [musteriResult] = await pool.execute(`
      SELECT COUNT(*) AS totalMusteri 
      FROM musteri
      WHERE is_test = 0
    `);
    const totalMusteri = Number(musteriResult[0]?.totalMusteri) || 0;

    // 2. Toplam Randevu Sayısı
    const [randevuResult] = await pool.execute(`
      SELECT COUNT(*) AS totalRandevu 
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      WHERE m.is_test = 0
    `);
    const totalRandevu = Number(randevuResult[0]?.totalRandevu) || 0;

    // 3. Toplam Gelir (hizmet.fiyat_araligi üzerinden hesaplama)
    // Format: "800-1500 TL" → (800 + 1500) / 2 = 1150
    // SUBSTRING_INDEX ve CAST kullanarak SQL'de hesaplama
    const [gelirResult] = await pool.execute(`
      SELECT 
        IFNULL(
          SUM(
            (
              CAST(
                SUBSTRING_INDEX(
                  REPLACE(REPLACE(h.fiyat_araligi, ' TL', ''), 'TL', ''),
                  '-',
                  1
                ) AS UNSIGNED
              ) +
              CAST(
                SUBSTRING_INDEX(
                  REPLACE(REPLACE(h.fiyat_araligi, ' TL', ''), 'TL', ''),
                  '-',
                  -1
                ) AS UNSIGNED
              )
            ) / 2
          ),
          0
        ) AS toplamGelir
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      LEFT JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE m.is_test = 0
        AND h.fiyat_araligi IS NOT NULL
        AND h.fiyat_araligi LIKE '%-%'
    `);
    const toplamGelir = Math.round(Number(gelirResult[0]?.toplamGelir) || 0);

    // 4. Ortalama Randevu Değeri
    // toplamGelir / totalRandevu (randevu varsa)
    const ortalamaRandevu = totalRandevu > 0 
      ? Math.round(toplamGelir / totalRandevu) 
      : 0;

    // Sonuç döndür
    res.json({
      totalMusteri,
      totalRandevu,
      toplamGelir,
      ortalamaRandevu
    });

  } catch (error) {
    console.error('❌ Dashboard hatası:', error);
    res.status(500).json({ 
      error: 'Dashboard verisi alınamadı',
      message: error.message 
    });
  }
};





