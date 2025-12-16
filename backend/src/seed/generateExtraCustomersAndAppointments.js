import pool from '../lib/db.js';

/* ----------------- yardımcılar ----------------- */

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return '05' + Math.floor(100000000 + Math.random() * 900000000);
}

function randomDate(startYear = 1970, endYear = 2005) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAge(date) {
  return new Date().getFullYear() - date.getFullYear();
}

function randomAppointmentDateLast12Months() {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - 12);

  const d = new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  return d.toISOString().split('T')[0]; // ✅ DATE FORMAT
}

/* ----------------- ANA FONKSİYON ----------------- */

export default async function generateExtraCustomersAndAppointments() {
  console.log('🔥 EXTRA CUSTOMER + APPOINTMENT SEED BAŞLADI');

  /* İlçe ID’leri */
  const [ilceler] = await pool.query('SELECT ilce_id FROM ilce');
  const ilceIds = ilceler.map(i => i.ilce_id);

  /* Hizmet ID’leri */
  const [hizmetler] = await pool.query('SELECT hizmet_id FROM hizmet');
  const hizmetIds = hizmetler.map(h => h.hizmet_id);

  /* Kampanya ID’leri */
  const [kampanyalar] = await pool.query('SELECT kampanya_id FROM kampanya');
  const kampanyaIds = kampanyalar.map(k => k.kampanya_id);

  /* ----------------- MÜŞTERİ EKLE ----------------- */

  const musteriValues = [];
  const CUSTOMER_COUNT = 120;

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const dogum = randomDate();
    musteriValues.push([
      `Müşteri${i + 1}`,
      `Soyad${i + 1}`,
      dogum.toISOString().split('T')[0],
      randomAge(dogum),
      randomPhone(),
      randomItem(ilceIds),
    ]);
  }

  await pool.query(
    `INSERT INTO musteri (ad, soyad, dogum_tarihi, yas, telefon, ilce_id) VALUES ?`,
    [musteriValues]
  );

  console.log(`✅ ${CUSTOMER_COUNT} müşteri eklendi`);

  /* ----------------- RANDEVU EKLE ----------------- */

  const [musteriler] = await pool.query('SELECT musteri_id FROM musteri');
  const musteriIds = musteriler.map(m => m.musteri_id);

  const randevuValues = [];

  for (const musteriId of musteriIds) {
    const count = 3 + Math.floor(Math.random() * 4); // 6–15 randevu

    for (let i = 0; i < count; i++) {
      const kampanyaId =
        kampanyaIds.length > 0 && Math.random() > 0.4
          ? randomItem(kampanyaIds)
          : null;

      randevuValues.push([
        musteriId,
        randomItem(hizmetIds),
        randomAppointmentDateLast12Months(),
        kampanyaId,
      ]);
    }
  }

  await pool.query(
    `INSERT INTO randevu (musteri_id, hizmet_id, tarih, kampanya_id) VALUES ?`,
    [randevuValues]
  );

  console.log(`✅ ${randevuValues.length} randevu eklendi`);
}

