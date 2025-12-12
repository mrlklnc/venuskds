# 🧪 Quick Test Guide for Analytics Endpoints

## Test Backend Endpoints

### Option 1: Using curl (Command Line)

```bash
# Test customer distribution endpoint
curl http://localhost:3000/api/dss/musteri-ilce

# Test monthly appointments endpoint
curl http://localhost:3000/api/dss/randevu-aylik
```

### Option 2: Using Browser

1. Open browser
2. Navigate to:
   - `http://localhost:3000/api/dss/musteri-ilce`
   - `http://localhost:3000/api/dss/randevu-aylik`

### Option 3: Using Postman/Insomnia

**GET** `http://localhost:3000/api/dss/musteri-ilce`
**GET** `http://localhost:3000/api/dss/randevu-aylik`

## Expected Responses

### Success Response (musteri-ilce):
```json
[
  { "ilce": "Bornova", "sayi": 45 },
  { "ilce": "Karşıyaka", "sayi": 32 }
]
```

### Success Response (randevu-aylik):
```json
[
  { "ay": "2025-01", "sayi": 120 },
  { "ay": "2025-02", "sayi": 145 }
]
```

### Error Response:
```json
{
  "error": "Error message here"
}
```

### Empty Response (No Data):
```json
[]
```

## Troubleshooting

**If you get CORS errors:**
- Check `backend/src/server.js` has `app.use(cors());`
- Restart backend server

**If you get 404 errors:**
- Verify backend is running on port 3000
- Check route registration in `server.js`

**If you get empty arrays:**
- Database may be empty
- Run seed script: `cd backend && npx prisma db seed`
- Or run SQL fixes from DIAGNOSTIC_REPORT.md

**If you get 500 errors:**
- Check backend console for error details
- Verify database connection in `.env` file
- Check Prisma schema matches database structure

