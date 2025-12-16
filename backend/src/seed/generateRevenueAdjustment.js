import pool from '../lib/db.js';

/**
 * Hizmet adına göre fiyat kategorisi belirle
 */
function getPriceRangeForService(hizmetAd) {
  if (!hizmetAd) {
    return { min: 300, max: 700 }; // Varsayılan: Basit işlem
  }

  const serviceName = hizmetAd.toLowerCase();

  // Lazer / cihazlı işlemler: 1200-3500 TL
  if (
    serviceName.includes('lazer') ||
    serviceName.includes('lazır') ||
    serviceName.includes('cihaz') ||
    serviceName.includes('epilasyon') ||
    serviceName.includes('ipl')
  ) {
    return { min: 1200, max: 3500 };
  }

  // Cilt bakımı / hydrafacial: 800-1800 TL
  if (
    serviceName.includes('cilt') ||
    serviceName.includes('hydrafacial') ||
    serviceName.includes('hidrafasiyal') ||
    serviceName.includes('facial') ||
    serviceName.includes('bakım')
  ) {
    return { min: 800, max: 1800 };
  }

  // Basit işlemler: 300-700 TL (varsayılan)
  return { min: 300, max: 700 };
}

/**
 * Belirli aralıktan rastgele fiyat üret
 */
function generateRandomPrice(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/**
 * İndirim uygula (%10-40 arası)
 */
function applyDiscount(basePrice, discountPercent) {
  const discountedPrice = basePrice * (1 - discountPercent / 100);
  return Math.round(discountedPrice * 100) / 100;
}

/**
 * Tüm randevuları hizmet ve kampanya bilgisiyle getir
 */
async function getAllAppointmentsWithDetails() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        r.randevu_id,
        r.fiyat,
        r.kampanya_id,
        h.hizmet_ad,
        k.indirim_orani
      FROM randevu r
      LEFT JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      LEFT JOIN kampanya k ON r.kampanya_id = k.kampanya_id
    `);
    return rows;
  } catch (error) {
    console.error('Randevu bilgileri alınırken hata:', error);
    throw error;
  }
}

/**
 * Randevu fiyatını güncelle
 */
async function updateAppointmentPrice(randevuId, newPrice) {
  try {
    await pool.execute(
      'UPDATE randevu SET fiyat = ? WHERE randevu_id = ?',
      [newPrice, randevuId]
    );
  } catch (error) {
    console.error(`Randevu ${randevuId} güncellenirken hata:`, error);
    throw error;
  }
}

/**
 * Mevcut randevuların fiyatlarını gerçekçi hale getir
 */
export default async function generateRevenueAdjustment() {
  try {
    console.log('Randevu fiyatları güncelleniyor...');

    // Tüm randevuları detaylarıyla getir
    const appointments = await getAllAppointmentsWithDetails();

    if (appointments.length === 0) {
      console.log('Güncellenecek randevu bulunamadı.');
      return;
    }

    let updatedCount = 0;

    // Her randevu için fiyat hesapla ve güncelle
    for (const appointment of appointments) {
      const { randevu_id, hizmet_ad, kampanya_id, indirim_orani } = appointment;

      // Hizmet türüne göre fiyat aralığı belirle
      const priceRange = getPriceRangeForService(hizmet_ad);
      
      // Rastgele base fiyat üret
      let newPrice = generateRandomPrice(priceRange.min, priceRange.max);

      // Kampanya varsa indirim uygula
      if (kampanya_id && indirim_orani) {
        // Kampanya indirim oranını kullan veya rastgele %10-40
        let discountPercent = indirim_orani;
        
        // Eğer kampanya indirim oranı yoksa veya 0 ise, rastgele %10-40 indirim uygula
        if (!discountPercent || discountPercent === 0) {
          discountPercent = 10 + Math.random() * 30; // %10-40
        } else {
          // Mevcut indirim oranını %10-40 aralığına normalize et
          discountPercent = Math.max(10, Math.min(40, discountPercent));
        }
        
        newPrice = applyDiscount(newPrice, discountPercent);
      }

      // Fiyatı güncelle
      await updateAppointmentPrice(randevu_id, newPrice);
      updatedCount++;
    }

    console.log(`Toplam ${updatedCount} randevu ücreti güncellendi`);
    
  } catch (error) {
    console.error('Fiyat güncelleme hatası:', error);
    throw error;
  }
}





