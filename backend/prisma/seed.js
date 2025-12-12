import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.memnuniyet.deleteMany();
  await prisma.randevu.deleteMany();
  await prisma.sube_masraf.deleteMany();
  await prisma.sube.deleteMany();
  await prisma.musteri.deleteMany();
  await prisma.rakip_isletme.deleteMany();
  await prisma.kampanya.deleteMany();
  await prisma.hizmet.deleteMany();
  await prisma.ilce.deleteMany();

  // Create İlçeler (İzmir districts)
  const ilceler = await Promise.all([
    prisma.ilce.create({
      data: {
        ilce_ad: 'Konak',
        nufus: 350000,
        ort_gelir: 45000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Bornova',
        nufus: 420000,
        ort_gelir: 48000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Karşıyaka',
        nufus: 380000,
        ort_gelir: 52000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Buca',
        nufus: 320000,
        ort_gelir: 38000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Çiğli',
        nufus: 180000,
        ort_gelir: 42000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Bayraklı',
        nufus: 310000,
        ort_gelir: 40000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Alsancak',
        nufus: 150000,
        ort_gelir: 55000
      }
    }),
    prisma.ilce.create({
      data: {
        ilce_ad: 'Güzelbahçe',
        nufus: 45000,
        ort_gelir: 60000
      }
    })
  ]);

  console.log(`✅ Created ${ilceler.length} districts`);

  // Create Hizmetler (Services)
  const hizmetler = await Promise.all([
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Lazer Epilasyon',
        fiyat_araligi: '500-2000 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Hydrafacial',
        fiyat_araligi: '800-1500 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Cilt Bakımı',
        fiyat_araligi: '300-800 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Saç Kesimi',
        fiyat_araligi: '150-400 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Saç Boyama',
        fiyat_araligi: '400-1200 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Makyaj',
        fiyat_araligi: '250-600 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Kaş Tasarımı',
        fiyat_araligi: '200-500 TL'
      }
    }),
    prisma.hizmet.create({
      data: {
        hizmet_ad: 'Manikür & Pedikür',
        fiyat_araligi: '150-350 TL'
      }
    })
  ]);

  console.log(`✅ Created ${hizmetler.length} services`);

  // Create Kampanyalar (Campaigns)
  const kampanyalar = await Promise.all([
    prisma.kampanya.create({
      data: {
        kampanya_ad: 'Yaz İndirimi',
        baslangic: new Date('2025-06-01'),
        bitis: new Date('2025-08-31'),
        indirim_orani: 20
      }
    }),
    prisma.kampanya.create({
      data: {
        kampanya_ad: 'Kış Bakım Paketi',
        baslangic: new Date('2025-12-01'),
        bitis: new Date('2025-02-28'),
        indirim_orani: 15
      }
    }),
    prisma.kampanya.create({
      data: {
        kampanya_ad: 'İlk Randevu İndirimi',
        baslangic: new Date('2025-01-01'),
        bitis: new Date('2025-12-31'),
        indirim_orani: 10
      }
    }),
    prisma.kampanya.create({
      data: {
        kampanya_ad: 'Sevgililer Günü Özel',
        baslangic: new Date('2025-02-10'),
        bitis: new Date('2025-02-20'),
        indirim_orani: 25
      }
    })
  ]);

  console.log(`✅ Created ${kampanyalar.length} campaigns`);

  // Create Subeler (Branches)
  const subeler = await Promise.all([
    prisma.sube.create({
      data: {
        sube_ad: 'Konak Merkez Şube',
        adres: 'Konak Meydanı No:1, Konak',
        telefon: '0232 123 4567',
        acilis_tarihi: new Date('2020-01-15'),
        ilce_id: ilceler[0].ilce_id
      }
    }),
    prisma.sube.create({
      data: {
        sube_ad: 'Bornova Şube',
        adres: 'Bornova Caddesi No:25, Bornova',
        telefon: '0232 234 5678',
        acilis_tarihi: new Date('2021-03-20'),
        ilce_id: ilceler[1].ilce_id
      }
    }),
    prisma.sube.create({
      data: {
        sube_ad: 'Karşıyaka Şube',
        adres: 'Karşıyaka Sahil No:10, Karşıyaka',
        telefon: '0232 345 6789',
        acilis_tarihi: new Date('2022-06-10'),
        ilce_id: ilceler[2].ilce_id
      }
    })
  ]);

  console.log(`✅ Created ${subeler.length} branches`);

  // Create Rakip İşletmeler (Competitors)
  const rakipler = [];
  for (let i = 0; i < ilceler.length; i++) {
    const count = Math.floor(Math.random() * 5) + 2; // 2-6 competitors per district
    for (let j = 0; j < count; j++) {
      rakipler.push(
        prisma.rakip_isletme.create({
          data: {
            rakip_ad: `${ilceler[i].ilce_ad} Güzellik Salonu ${j + 1}`,
            ilce_id: ilceler[i].ilce_id,
            hizmet_turu: ['Lazer', 'Cilt Bakımı', 'Saç', 'Makyaj'][Math.floor(Math.random() * 4)]
          }
        })
      );
    }
  }
  await Promise.all(rakipler);
  console.log(`✅ Created ${rakipler.length} competitors`);

  // Create Müşteriler (Customers)
  const isimler = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Deniz', 'Ceren', 'Burcu', 'Derya'];
  const soyisimler = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Arslan', 'Öztürk', 'Aydın', 'Özdemir'];
  const cinsiyetler = ['Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın', 'Kadın']; // Beauty salon
  const segmentler = ['A', 'B', 'C'];

  const musteriler = [];
  for (let i = 0; i < 200; i++) {
    const dogumYili = 1980 + Math.floor(Math.random() * 30);
    const dogumTarihi = new Date(dogumYili, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const yas = 2025 - dogumYili;
    const ilceIndex = Math.floor(Math.random() * ilceler.length);

    musteriler.push(
      prisma.musteri.create({
        data: {
          ad: isimler[Math.floor(Math.random() * isimler.length)],
          soyad: soyisimler[Math.floor(Math.random() * soyisimler.length)],
          cinsiyet: cinsiyetler[Math.floor(Math.random() * cinsiyetler.length)],
          dogum_tarihi: dogumTarihi,
          yas: yas,
          ilce_id: ilceler[ilceIndex].ilce_id,
          segment: segmentler[Math.floor(Math.random() * segmentler.length)]
        }
      })
    );
  }
  const createdMusteriler = await Promise.all(musteriler);
  console.log(`✅ Created ${createdMusteriler.length} customers`);

  // Create Randevular (Appointments) for 2025
  const randevular = [];
  const fiyatlar = {
    'Lazer Epilasyon': [500, 2000],
    'Hydrafacial': [800, 1500],
    'Cilt Bakımı': [300, 800],
    'Saç Kesimi': [150, 400],
    'Saç Boyama': [400, 1200],
    'Makyaj': [250, 600],
    'Kaş Tasarımı': [200, 500],
    'Manikür & Pedikür': [150, 350]
  };

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(2025, month, 0).getDate();
    const appointmentsPerMonth = 150 + Math.floor(Math.random() * 100);

    for (let i = 0; i < appointmentsPerMonth; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const tarih = new Date(2025, month - 1, day);
      const saat = `${9 + Math.floor(Math.random() * 9)}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`;
      
      const musteri = createdMusteriler[Math.floor(Math.random() * createdMusteriler.length)];
      const hizmet = hizmetler[Math.floor(Math.random() * hizmetler.length)];
      const [minFiyat, maxFiyat] = fiyatlar[hizmet.hizmet_ad] || [200, 500];
      const fiyat = minFiyat + Math.random() * (maxFiyat - minFiyat);
      
      // 30% chance of having a campaign
      const kampanya = Math.random() < 0.3 
        ? kampanyalar[Math.floor(Math.random() * kampanyalar.length)]
        : null;
      
      // Check if campaign is active
      let activeKampanya = null;
      if (kampanya && tarih >= kampanya.baslangic && tarih <= kampanya.bitis) {
        activeKampanya = kampanya;
      }

      randevular.push(
        prisma.randevu.create({
          data: {
            musteri_id: musteri.musteri_id,
            hizmet_id: hizmet.hizmet_id,
            fiyat: fiyat,
            tarih: tarih,
            saat: saat,
            kampanya_id: activeKampanya ? activeKampanya.kampanya_id : null
          }
        })
      );
    }
  }

  const createdRandevular = await Promise.all(randevular);
  console.log(`✅ Created ${createdRandevular.length} appointments`);

  // Create Memnuniyet (Satisfaction) - 70% of appointments have feedback
  const memnuniyetler = [];
  for (let i = 0; i < Math.floor(createdRandevular.length * 0.7); i++) {
    const randevu = createdRandevular[Math.floor(Math.random() * createdRandevular.length)];
    
    // Skip if already has satisfaction
    if (memnuniyetler.find(m => m.randevu_id === randevu.randevu_id)) continue;

    const puan = Math.random() < 0.8 ? (4 + Math.floor(Math.random() * 2)) : (1 + Math.floor(Math.random() * 3)); // 80% chance of 4-5
    const yorumlar = [
      'Çok memnun kaldım, tekrar geleceğim.',
      'Harika bir hizmet, teşekkürler.',
      'İyi bir deneyimdi.',
      'Beklentilerimi karşıladı.',
      'Biraz daha iyi olabilirdi.',
      'Fiyat biraz yüksek.',
      'Mükemmel!',
      'Orta seviye bir hizmet.'
    ];

    memnuniyetler.push(
      prisma.memnuniyet.create({
        data: {
          randevu_id: randevu.randevu_id,
          puan: puan,
          yorum: yorumlar[Math.floor(Math.random() * yorumlar.length)],
          tarih: randevu.tarih
        }
      })
    );
  }

  await Promise.all(memnuniyetler);
  console.log(`✅ Created ${memnuniyetler.length} satisfaction records`);

  // Create Sube Masrafları (Branch Expenses)
  const masraflar = [];
  for (const sube of subeler) {
    for (let month = 1; month <= 12; month++) {
      const kira = 15000 + Math.random() * 10000;
      const personel_maas = 25000 + Math.random() * 15000;
      const diger = 5000 + Math.random() * 10000;
      const tutar = kira + personel_maas + diger;

      masraflar.push(
        prisma.sube_masraf.create({
          data: {
            sube_id: sube.sube_id,
            tutar: tutar,
            tarih: new Date(2025, month - 1, 15),
            aciklama: `${new Date(2025, month - 1, 1).toLocaleString('tr-TR', { month: 'long' })} ayı masrafları`
          }
        })
      );
    }
  }

  await Promise.all(masraflar);
  console.log(`✅ Created ${masraflar.length} expense records`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

