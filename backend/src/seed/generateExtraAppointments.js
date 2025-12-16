import pool from '../lib/db.js';

console.log("🔥 EXTRA APPOINTMENT SCRIPT BAŞLADI");

/**
 * Son 12 ay içinde rastgele tarih
 */
function getRandomDateInLast12Months() {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - 12);

  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime())
  );
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice() {
  return Math.floor(400 + Math.random() * 2600);
}

async function getIds(table, column) {
  const [rows] = await pool.query(`SELECT ${column} FROM ${table}`);
  return rows.map(r => r[column]);
}

async function generateExtraAppointments() {
  try {
    const musteriIds = await getIds('musteri', 'musteri_id');
    const hizmetIds = await getIds('hizmet', 'hizmet_id');
    const kampanyaIds = await getIds('kampanya', 'kampanya_id');

    if (!musteriIds.length || !hizmetIds.length) {
      console.error("❌ Gerekli veriler eksik");
      return;
    }

    let inserted = 0;

    for (const musteri_id of musteriIds) {
      const count = Math.floor(Math.random() * 10) + 5; // 5–15

      for (let i = 0; i < count; i++) {
        const tarihObj = getRandomDateInLast12Months();
        const tarih = tarihObj.toISOString().split('T')[0];

        const kampanya_id =
          Math.random() > 0.4 && kampanyaIds.length
            ? getRandomItem(kampanyaIds)
            : null;

        await pool.query(
          `INSERT INTO randevu 
           (musteri_id, sube_id, hizmet_id, kampanya_id, tarih, ucret)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            musteri_id,
            1, // sube_id sabit (istersen sonra random yaparız)
            getRandomItem(hizmetIds),
            kampanya_id,
            tarih,
            randomPrice()
          ]
        );

        inserted++;
      }
    }

    console.log(`✅ TOPLAM ${inserted} YENİ RANDEVU EKLENDİ`);
    process.exit(0);

  } catch (err) {
    console.error("❌ HATA:", err);
    process.exit(1);
  }
}

generateExtraAppointments();





