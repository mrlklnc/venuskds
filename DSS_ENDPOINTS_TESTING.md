# 🧪 DSS Endpoints Testing Guide

## 📍 Endpoint Overview

All endpoints are available under `/api/dss/` base path.

---

## 1️⃣ GET /api/dss/musteri-ilce

**Description**: Returns customer count per district

**Response Format**:
```json
[
  {
    "ilce": "Bornova",
    "sayi": 45
  },
  {
    "ilce": "Karşıyaka",
    "sayi": 32
  },
  {
    "ilce": "Bilinmeyen İlçe",
    "sayi": 5
  }
]
```

**Test Command**:
```bash
curl http://localhost:3000/api/dss/musteri-ilce
```

**Expected**: Array of objects with `ilce` (district name) and `sayi` (customer count)

---

## 2️⃣ GET /api/dss/aylik-randevu

**Description**: Returns appointment count per month in the last 6 months

**Response Format**:
```json
[
  {
    "ay": "2025-01",
    "ay_ad": "January 2025",
    "sayi": 120
  },
  {
    "ay": "2025-02",
    "ay_ad": "February 2025",
    "sayi": 145
  }
]
```

**Test Command**:
```bash
curl http://localhost:3000/api/dss/aylik-randevu
```

**Expected**: Array of objects with `ay` (YYYY-MM format), `ay_ad` (formatted month name), and `sayi` (appointment count)

---

## 3️⃣ GET /api/dss/hizmet-performans

**Description**: Returns average revenue per service

**Response Format**:
```json
[
  {
    "hizmet_id": 1,
    "hizmet_ad": "Saç Kesimi",
    "randevu_sayisi": 50,
    "toplam_gelir": 5000,
    "ortalama_fiyat": 100
  },
  {
    "hizmet_id": 2,
    "hizmet_ad": "Fön",
    "randevu_sayisi": 30,
    "toplam_gelir": 3000,
    "ortalama_fiyat": 100
  }
]
```

**Test Command**:
```bash
curl http://localhost:3000/api/dss/hizmet-performans
```

**Expected**: Array of objects with service details including total revenue and average price

---

## 4️⃣ GET /api/dss/rakip-analizi

**Description**: Returns competitor count per district

**Response Format**:
```json
[
  {
    "ilce": "Bornova",
    "rakip_sayisi": 8
  },
  {
    "ilce": "Karşıyaka",
    "rakip_sayisi": 5
  },
  {
    "ilce": "Bilinmeyen İlçe",
    "rakip_sayisi": 2
  }
]
```

**Test Command**:
```bash
curl http://localhost:3000/api/dss/rakip-analizi
```

**Expected**: Array of objects with `ilce` (district name) and `rakip_sayisi` (competitor count)

---

## 5️⃣ GET /api/dss/kampanya-analizi

**Description**: Returns number of appointments booked with campaign

**Response Format**:
```json
[
  {
    "kampanya_id": 1,
    "kampanya_ad": "Yaz İndirimi",
    "baslangic": "2025-06-01T00:00:00.000Z",
    "bitis": "2025-08-31T00:00:00.000Z",
    "indirim_orani": 20,
    "randevu_sayisi": 150,
    "toplam_gelir": 15000
  },
  {
    "kampanya_id": 2,
    "kampanya_ad": "Kış Kampanyası",
    "baslangic": "2025-12-01T00:00:00.000Z",
    "bitis": "2025-12-31T00:00:00.000Z",
    "indirim_orani": 15,
    "randevu_sayisi": 80,
    "toplam_gelir": 8000
  }
]
```

**Test Command**:
```bash
curl http://localhost:3000/api/dss/kampanya-analizi
```

**Expected**: Array of objects with campaign details including appointment count and total revenue

---

## 🧪 Testing All Endpoints at Once

### Using curl (Linux/Mac/Git Bash):
```bash
# Test all endpoints
echo "Testing musteri-ilce..."
curl http://localhost:3000/api/dss/musteri-ilce

echo "\n\nTesting aylik-randevu..."
curl http://localhost:3000/api/dss/aylik-randevu

echo "\n\nTesting hizmet-performans..."
curl http://localhost:3000/api/dss/hizmet-performans

echo "\n\nTesting rakip-analizi..."
curl http://localhost:3000/api/dss/rakip-analizi

echo "\n\nTesting kampanya-analizi..."
curl http://localhost:3000/api/dss/kampanya-analizi
```

### Using PowerShell (Windows):
```powershell
# Test all endpoints
Write-Host "Testing musteri-ilce..."
Invoke-RestMethod -Uri "http://localhost:3000/api/dss/musteri-ilce"

Write-Host "`nTesting aylik-randevu..."
Invoke-RestMethod -Uri "http://localhost:3000/api/dss/aylik-randevu"

Write-Host "`nTesting hizmet-performans..."
Invoke-RestMethod -Uri "http://localhost:3000/api/dss/hizmet-performans"

Write-Host "`nTesting rakip-analizi..."
Invoke-RestMethod -Uri "http://localhost:3000/api/dss/rakip-analizi"

Write-Host "`nTesting kampanya-analizi..."
Invoke-RestMethod -Uri "http://localhost:3000/api/dss/kampanya-analizi"
```

### Using Browser:
Simply navigate to each URL:
- `http://localhost:3000/api/dss/musteri-ilce`
- `http://localhost:3000/api/dss/aylik-randevu`
- `http://localhost:3000/api/dss/hizmet-performans`
- `http://localhost:3000/api/dss/rakip-analizi`
- `http://localhost:3000/api/dss/kampanya-analizi`

---

## ✅ Expected Results

### Success Response:
- Status Code: `200 OK`
- Content-Type: `application/json`
- Body: Array of objects with relevant data

### Empty Data Response:
- Status Code: `200 OK`
- Body: `[]` (empty array)

### Error Response:
- Status Code: `500 Internal Server Error`
- Body: `{ "error": "Error message here" }`

---

## 🔍 Troubleshooting

### If you get 404 Not Found:
- Verify backend server is running: `npm start` in `/backend` folder
- Check route registration in `server.js`
- Verify endpoint path is correct

### If you get 500 Internal Server Error:
- Check backend console for error details
- Verify database connection in `.env` file
- Check Prisma schema matches database structure
- Ensure database tables have data

### If you get empty arrays:
- Database may be empty - run seed script: `npx prisma db seed`
- Or insert test data manually

### If you get CORS errors (from frontend):
- Verify `app.use(cors());` is in `server.js`
- Restart backend server

---

## 📊 Database Requirements

For endpoints to return data, ensure:

1. **musteri table**: Has customer records with `ilce_id` values
2. **randevu table**: Has appointment records with `tarih` values (for last 6 months)
3. **hizmet table**: Has service records
4. **rakip_isletme table**: Has competitor records with `ilce_id` values
5. **kampanya table**: Has campaign records
6. **ilce table**: Has district records

---

## 🚀 Quick Start

1. **Start backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Test endpoints** using any method above

3. **Check responses** - should return JSON arrays

4. **Verify data** - if empty, seed database or add test data

---

**All endpoints are now ready for testing!** 🎉

