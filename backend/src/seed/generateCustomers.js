import pool from '../lib/db.js';

// Türkçe isim listesi
const turkishNames = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Deniz', 'Ceren', 'Burcu', 'Derya',
  'Gizem', 'Pınar', 'Serap', 'Melis', 'Özge', 'Banu', 'Esra', 'İpek', 'Buse', 'Tuğba',
  'Ebru', 'Seda', 'Ayşegül', 'Şule', 'Gül', 'Emine', 'Hatice', 'Aysun', 'Yasemin', 'Özlem',
  'Mehmet', 'Ali', 'Mustafa', 'Ahmet', 'Hasan', 'Hüseyin', 'İbrahim', 'Osman', 'Yusuf', 'Recep',
  'Murat', 'Emre', 'Burak', 'Kerem', 'Can', 'Okan', 'Kemal', 'Serkan', 'Uğur', 'Deniz'
];

// Türkçe soyad listesi
const turkishSurnames = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Arslan', 'Öztürk', 'Aydın', 'Özdemir',
  'Aydın', 'Öztürk', 'Aksoy', 'Kılıç', 'Koç', 'Kurt', 'Şimşek', 'Erdoğan', 'Çetin', 'Polat',
  'Güneş', 'Doğan', 'Bulut', 'Çağlar', 'Özkan', 'Tekin', 'Acar', 'Çiftçi', 'Şen', 'Yıldırım',
  'Kara', 'Aktaş', 'Şahin', 'Türk', 'Özer', 'Şenol', 'Akar', 'Tuna', 'Özdemir', 'Güler'
];

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
 * Veritabanından tüm ilçe ID'lerini getir
 */
async function getAllIlceIds() {
  try {
    const [rows] = await pool.execute('SELECT ilce_id FROM ilce');
    return rows.map(row => row.ilce_id);
  } catch (error) {
    console.error('İlçe ID\'leri alınırken hata:', error);
    throw error;
  }
}

/**
 * Rastgele bir öğe seç
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 300-500 arasında rastgele müşteri oluştur
 */
export default async function generateCustomers() {
  try {
    // İlçe ID'lerini al
    const ilceIds = await getAllIlceIds();
    
    if (ilceIds.length === 0) {
      console.error('Veritabanında ilçe bulunamadı! Önce ilçe verilerini ekleyin.');
      return;
    }

    // 300-500 arası rastgele sayı
    const customerCount = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
    
    console.log(`${customerCount} müşteri oluşturuluyor...`);

    // Müşterileri toplu olarak eklemek için array
    const customers = [];

    for (let i = 0; i < customerCount; i++) {
      const ad = getRandomItem(turkishNames);
      const soyad = getRandomItem(turkishSurnames);
      const ilce_id = getRandomItem(ilceIds);
      const created_at = getRandomDateInLast12Months();
      
      // MySQL DATE formatına çevir (YYYY-MM-DD)
      const created_at_formatted = created_at.toISOString().split('T')[0];
      
      customers.push({
        ad,
        soyad,
        ilce_id,
        created_at: created_at_formatted
      });
    }

    // Toplu insert için SQL hazırla
    // Not: Schema'da created_at alanı yoksa, INSERT sırasında bu alanı atlayacağız
    // Sadece ad, soyad, ilce_id ile çalışalım
    const insertQuery = `
      INSERT INTO musteri (ad, soyad, ilce_id)
      VALUES ?
    `;

    // Values array'ini hazırla (her müşteri için [ad, soyad, ilce_id])
    const values = customers.map(customer => [
      customer.ad,
      customer.soyad,
      customer.ilce_id
    ]);

    // MySQL'de toplu insert için VALUES formatı: [[val1, val2], [val3, val4], ...]
    await pool.query(insertQuery, [values]);

    console.log(`${customerCount} müşteri başarıyla eklendi`);
    
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    throw error;
  }
}





