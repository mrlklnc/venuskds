import pool from '../lib/db.js';

/**
 * Son 12 ay içinde rastgele bir tarih oluştur
 */
function getRandomDateInLast12Months() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const randomTime = twelveMonthsAgo.getTime() + 
    Math.random() * (now.getTime() - twelveMonthsAgo.getTime());
  
  return new Date(randomTime);
}

/**
 * fiyat_araligi string'ini parse edip min-max arasında rastgele fiyat üret
 * Örnekler: "500-2000 TL", "1000-3000", "500 TL", "2000"
 */
function parsePriceFromRange(fiyatAraligi) {
  if (!fiyatAraligi || typeof fiyatAraligi !== 'string') {
    // Varsayılan fiyat aralığı
    return 200 + Math.random() * 800; // 200-1000 arası
  }

  // Sayıları çıkar (TL, ₺ gibi karakterleri temizle)
  const numbers = fiyatAraligi.match(/\d+/g);
  
  if (!numbers || numbers.length === 0) {
    return 200 + Math.random() * 800; // Varsayılan
  }

  if (numbers.length === 1) {
    // Tek değer varsa, %80-120 arası varyasyon ekle
    const basePrice = parseFloat(numbers[0]);
    return basePrice * (0.8 + Math.random() * 0.4);
  }

  if (numbers.length >= 2) {
    // İlk iki sayı min-max olarak kabul et
    const min = parseFloat(numbers[0]);
    const max = parseFloat(numbers[1]);
    return min + Math.random() * (max - min);
  }

  return 200 + Math.random() * 800; // Varsayılan
}

/**
 * Rastgele bir öğe seç
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Rastgele saat üret (09:00 - 18:00 arası)
 */
function getRandomTime() {
  const hour = 9 + Math.floor(Math.random() * 9); // 9-17
  const minute = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
  return `${hour}:${minute}`;
}

/**
 * Tüm müşteri ID'lerini getir
 */
async function getAllMusteriIds() {
  try {
    const [rows] = await pool.execute('SELECT musteri_id FROM musteri');
    return rows.map(row => row.musteri_id);
  } catch (error) {
    console.error('Müşteri ID\'leri alınırken hata:', error);
    throw error;
  }
}

/**
 * Tüm hizmet bilgilerini getir (hizmet_id, fiyat_araligi)
 */
async function getAllHizmetler() {
  try {
    const [rows] = await pool.execute('SELECT hizmet_id, fiyat_araligi FROM hizmet');
    return rows;
  } catch (error) {
    console.error('Hizmet bilgileri alınırken hata:', error);
    throw error;
  }
}

/**
 * Tüm kampanya bilgilerini getir (kampanya_id, indirim_orani, baslangic, bitis)
 */
async function getAllKampanyalar() {
  try {
    const [rows] = await pool.execute(
      'SELECT kampanya_id, indirim_orani, baslangic, bitis FROM kampanya'
    );
    return rows.map(row => ({
      kampanya_id: row.kampanya_id,
      indirim_orani: row.indirim_orani || 0,
      baslangic: row.baslangic ? new Date(row.baslangic) : null,
      bitis: row.bitis ? new Date(row.bitis) : null
    }));
  } catch (error) {
    console.error('Kampanya bilgileri alınırken hata:', error);
    throw error;
  }
}

/**
 * Belirli bir tarih için aktif kampanya bul
 */
function getActiveCampaignForDate(kampanyalar, tarih) {
  const activeCampaigns = kampanyalar.filter(kampanya => {
    if (!kampanya.baslangic || !kampanya.bitis) return false;
    return tarih >= kampanya.baslangic && tarih <= kampanya.bitis;
  });

  if (activeCampaigns.length === 0) return null;
  
  // Rastgele bir aktif kampanya seç
  return getRandomItem(activeCampaigns);
}

/**
 * Her müşteri için 3-6 arası randevu üret
 */
export default async function generateAppointments() {
  try {
    // Verileri getir
    const musteriIds = await getAllMusteriIds();
    const hizmetler = await getAllHizmetler();
    const kampanyalar = await getAllKampanyalar();

    if (musteriIds.length === 0) {
      console.error('Veritabanında müşteri bulunamadı! Önce müşteri verilerini ekleyin.');
      return;
    }

    if (hizmetler.length === 0) {
      console.error('Veritabanında hizmet bulunamadı! Önce hizmet verilerini ekleyin.');
      return;
    }

    console.log(`${musteriIds.length} müşteri için randevu oluşturuluyor...`);

    const appointments = [];
    let totalAppointments = 0;

    // Her müşteri için 3-6 arası randevu oluştur
    for (const musteriId of musteriIds) {
      const appointmentCount = Math.floor(Math.random() * (6 - 3 + 1)) + 3; // 3-6 arası
      
      for (let i = 0; i < appointmentCount; i++) {
        // Rastgele tarih (son 12 ay)
        const tarih = getRandomDateInLast12Months();
        const tarih_formatted = tarih.toISOString().split('T')[0];

        // Rastgele hizmet seç
        const hizmet = getRandomItem(hizmetler);
        
        // Fiyat hesapla
        let basePrice = parsePriceFromRange(hizmet.fiyat_araligi);
        let kampanya_id = null;
        let finalPrice = basePrice;

        // %30 şansla kampanya uygula (ve aktif kampanya varsa)
        if (Math.random() < 0.3) {
          const activeCampaign = getActiveCampaignForDate(kampanyalar, tarih);
          if (activeCampaign && activeCampaign.indirim_orani > 0) {
            kampanya_id = activeCampaign.kampanya_id;
            const indirimOrani = activeCampaign.indirim_orani / 100; // Yüzdeyi ondalığa çevir
            finalPrice = basePrice * (1 - indirimOrani);
          }
        }

        // Rastgele saat
        const saat = getRandomTime();

        appointments.push({
          musteri_id: musteriId,
          hizmet_id: hizmet.hizmet_id,
          tarih: tarih_formatted,
          saat: saat,
          fiyat: Math.round(finalPrice * 100) / 100, // 2 ondalık basamak
          kampanya_id: kampanya_id
        });

        totalAppointments++;
      }
    }

    // Toplu insert
    const insertQuery = `
      INSERT INTO randevu (musteri_id, hizmet_id, tarih, saat, fiyat, kampanya_id)
      VALUES ?
    `;

    // Values array'ini hazırla
    const values = appointments.map(apt => [
      apt.musteri_id,
      apt.hizmet_id,
      apt.tarih,
      apt.saat,
      apt.fiyat,
      apt.kampanya_id
    ]);

    // MySQL'de toplu insert
    await pool.query(insertQuery, [values]);

    console.log(`${totalAppointments} randevu başarıyla eklendi`);
    
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    throw error;
  }
}





