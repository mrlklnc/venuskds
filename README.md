# Venüs Güzellik Salonu - Decision Support System (DSS)

A comprehensive Decision Support System web application for Venüs Güzellik Salonu built with Node.js, Express, React, and MySQL.

## 🎯 Project Overview

This DSS helps answer critical business questions:
- Which İzmir district is best for opening a new branch?
- Which services perform best in 2025?
- Which campaigns are more effective?
- Customer satisfaction insights
- Which districts generate more demand?
- Competitor density & investment risk
- Expected revenue & ROI for new branch

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express** - REST API server
- **Prisma** - ORM for MySQL
- **MySQL** - Database

### Frontend
- **React** + **Vite** - UI framework
- **TailwindCSS** - Styling
- **Chart.js** - Data visualization
- **Zustand** - State management (ready for use)

## 📁 Project Structure

```
proje/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   ├── musteri.js
│   │   │   ├── randevu.js
│   │   │   ├── hizmet.js
│   │   │   ├── ilce.js
│   │   │   ├── kampanya.js
│   │   │   ├── memnuniyet.js
│   │   │   ├── masraf.js
│   │   │   ├── rakip.js
│   │   │   ├── sube.js
│   │   │   └── dss.js       # Decision Support endpoints
│   │   └── server.js        # Express server
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Seed data generator
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── lib/             # Utilities
    │   └── App.jsx
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL="mysql://user:password@localhost:3306/venus_dss"
PORT=3000
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database with sample data:
```bash
npm run prisma:seed
```

7. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📊 Database Schema

The system uses the following main tables:

- **ilce** - Districts (ilce_id, ilce_ad, nufus, ort_gelir)
- **musteri** - Customers (musteri_id, ad, soyad, cinsiyet, dogum_tarihi, ilce_id, yas, segment)
- **hizmet** - Services (hizmet_id, hizmet_ad, fiyat_araligi)
- **randevu** - Appointments (randevu_id, musteri_id, hizmet_id, fiyat, tarih, saat)
- **memnuniyet** - Satisfaction (memnuniyet_id, randevu_id, puan, yorum, tarih)
- **kampanya** - Campaigns (kampanya_id, kampanya_ad, baslangic, bitis, indirim_orani)
- **rakip_isletme** - Competitors (rakip_id, ilce_id, rakip_ad, hizmet_turu)
- **sube** - Branches (sube_id, sube_ad, adres, telefon, acilis_tarihi)
- **sube_masraf** - Branch Expenses (masraf_id, sube_id, tutar, tarih, aciklama)

## 🔌 API Endpoints

### Data Endpoints
All endpoints support CRUD operations:
- `GET /api/musteri` - List customers
- `GET /api/randevu` - List appointments
- `GET /api/hizmet` - List services
- `GET /api/ilce` - List districts
- `GET /api/kampanya` - List campaigns
- `GET /api/memnuniyet` - List satisfaction records
- `GET /api/masraf` - List expenses
- `GET /api/rakip` - List competitors
- `GET /api/sube` - List branches

### DSS Endpoints
- `GET /api/dss/overview` - Dashboard overview
- `GET /api/dss/best-district` - Best district analysis
- `GET /api/dss/service-performance` - Service performance analytics
- `GET /api/dss/campaign-effectiveness` - Campaign effectiveness
- `GET /api/dss/customer-satisfaction` - Customer satisfaction analysis
- `GET /api/dss/district-demand` - District demand analysis
- `GET /api/dss/competitor-analysis` - Competitor & risk analysis
- `GET /api/dss/branch-roi?ilce_id=X` - ROI projection for new branch

## 📈 Features

### Dashboard
- Total appointments and revenue
- Monthly comparison charts
- Service ranking
- District ranking
- Customer segmentation

### DSS Analysis
- **Best District**: Weighted scoring based on demand, revenue, competition, population, income, and spending
- **Service Performance**: Top services by revenue, seasonal trends, monthly breakdowns
- **Campaign Effectiveness**: ROI and performance metrics for each campaign
- **Customer Satisfaction**: Average scores, distribution, low-scoring services
- **District Demand**: Appointment and revenue analysis by district
- **Competitor Analysis**: Risk scoring based on competition density and demand
- **Branch ROI**: Revenue and profit projections for new branch locations

### Data Management
- Full CRUD operations for all entities
- Filtering and search capabilities
- Pagination support
- Date range filtering

## 🎨 UI Components

- Modern, responsive design with TailwindCSS
- Interactive charts using Chart.js
- KPI cards for key metrics
- Data tables with sorting and pagination
- Modal forms for create/edit operations

## 📝 Notes

- The seed script generates realistic 2025 data for testing
- All dates are formatted in Turkish locale
- Currency is displayed in Turkish Lira (TRY)
- The system is designed for İzmir districts but can be adapted

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### Database Migrations
```bash
cd backend
npm run prisma:migrate  # Create new migration
npm run prisma:generate # Regenerate Prisma client
```

## 📄 License

This project is proprietary software for Venüs Güzellik Salonu.

## 👥 Support

For issues or questions, please contact the development team.

