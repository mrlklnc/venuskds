import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// Best District for New Branch Analysis
router.get('/best-district', async (req, res) => {
  try {
    const districts = await prisma.ilce.findMany({
      include: {
        musteri: {
          include: {
            randevu: {
              where: {
                tarih: {
                  gte: new Date('2025-01-01'),
                  lte: new Date('2025-12-31')
                }
              }
            }
          }
        },
        rakip_isletme: true
      }
    });

    const scores = districts.map(ilce => {
      // Calculate demand (number of appointments)
      const demand = ilce.musteri.reduce((sum, m) => sum + m.randevu.length, 0);
      
      // Calculate revenue (total fiyat from appointments)
      const revenue = ilce.musteri.reduce((sum, m) => {
        return sum + m.randevu.reduce((s, r) => {
          return s + (r.fiyat ? Number(r.fiyat) : 0);
        }, 0);
      }, 0);
      
      // Competition count (inverse weight - fewer is better)
      const competition = ilce.rakip_isletme.length;
      
      // Population (normalized)
      const population = ilce.nufus || 0;
      
      // Average income
      const avgIncome = ilce.ort_gelir ? Number(ilce.ort_gelir) : 0;
      
      // Average spending per customer
      const customerCount = ilce.musteri.length || 1;
      const avgSpending = revenue / customerCount;
      
      // Weighted scoring
      const demandScore = Math.min(demand / 100, 1) * 0.25; // Max 100 appointments = 1.0
      const revenueScore = Math.min(revenue / 500000, 1) * 0.25; // Max 500k = 1.0
      const competitionScore = Math.max(0, 1 - (competition / 10)) * 0.15; // Fewer competitors = higher score
      const populationScore = Math.min(population / 500000, 1) * 0.15; // Max 500k population = 1.0
      const incomeScore = Math.min(avgIncome / 50000, 1) * 0.10; // Max 50k income = 1.0
      const spendingScore = Math.min(avgSpending / 5000, 1) * 0.10; // Max 5k spending = 1.0
      
      const totalScore = demandScore + revenueScore + competitionScore + 
                        populationScore + incomeScore + spendingScore;
      
      return {
        ilce_id: ilce.ilce_id,
        ilce_ad: ilce.ilce_ad,
        nufus: population,
        ort_gelir: avgIncome,
        demand,
        revenue,
        competition,
        avgSpending,
        score: totalScore,
        metrics: {
          demandScore,
          revenueScore,
          competitionScore,
          populationScore,
          incomeScore,
          spendingScore
        }
      };
    });

    scores.sort((a, b) => b.score - a.score);
    
    res.json({
      bestDistricts: scores.slice(0, 10),
      allDistricts: scores
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Service Performance Analytics
router.get('/service-performance', async (req, res) => {
  try {
    const { year = 2025 } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const services = await prisma.hizmet.findMany({
      include: {
        randevu: {
          where: {
            tarih: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const performance = services.map(hizmet => {
      const appointments = hizmet.randevu;
      const revenue = appointments.reduce((sum, r) => {
        return sum + (r.fiyat ? Number(r.fiyat) : 0);
      }, 0);
      
      // Monthly breakdown
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(year, i, 1);
        const monthEnd = new Date(year, i + 1, 0);
        const monthAppointments = appointments.filter(r => {
          if (!r.tarih) return false;
          const date = new Date(r.tarih);
          return date >= monthStart && date <= monthEnd;
        });
        return {
          month: i + 1,
          count: monthAppointments.length,
          revenue: monthAppointments.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0)
        };
      });

      return {
        hizmet_id: hizmet.hizmet_id,
        hizmet_ad: hizmet.hizmet_ad,
        fiyat_araligi: hizmet.fiyat_araligi,
        totalAppointments: appointments.length,
        totalRevenue: revenue,
        avgRevenue: appointments.length > 0 ? revenue / appointments.length : 0,
        monthlyData
      };
    });

    performance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Top 5 services by revenue
    const top5ByRevenue = performance.slice(0, 5);

    // Seasonal analysis (winter = Dec, Jan, Feb)
    const winterServices = performance.map(s => {
      const winterMonths = s.monthlyData.filter(m => m.month === 12 || m.month === 1 || m.month === 2);
      const winterRevenue = winterMonths.reduce((sum, m) => sum + m.revenue, 0);
      return {
        ...s,
        winterRevenue,
        winterPeak: winterRevenue > s.totalRevenue * 0.3 // More than 30% in winter
      };
    }).filter(s => s.winterPeak).sort((a, b) => b.winterRevenue - a.winterRevenue);

    // Hydrafacial trend (assuming service name contains "hydrafacial" or similar)
    const hydrafacial = performance.find(s => 
      s.hizmet_ad?.toLowerCase().includes('hydrafacial') || 
      s.hizmet_ad?.toLowerCase().includes('hidrafasiyal')
    );

    res.json({
      top5ByRevenue,
      allServices: performance,
      winterPeakServices: winterServices,
      hydrafacialTrend: hydrafacial ? hydrafacial.monthlyData : null,
      year: parseInt(year)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Campaign Effectiveness
router.get('/campaign-effectiveness', async (req, res) => {
  try {
    const campaigns = await prisma.kampanya.findMany({
      include: {
        randevu: {
          include: {
            hizmet: true,
            musteri: true
          }
        }
      }
    });

    const effectiveness = campaigns.map(kampanya => {
      const appointments = kampanya.randevu;
      const revenue = appointments.reduce((sum, r) => {
        return sum + (r.fiyat ? Number(r.fiyat) : 0);
      }, 0);
      
      const avgDiscount = kampanya.indirim_orani || 0;
      const potentialRevenue = appointments.reduce((sum, r) => {
        const basePrice = r.fiyat ? Number(r.fiyat) : 0;
        const discountedPrice = basePrice * (1 - avgDiscount / 100);
        return sum + discountedPrice;
      }, 0);
      
      const discountAmount = revenue - potentialRevenue; // Negative means savings
      
      return {
        kampanya_id: kampanya.kampanya_id,
        kampanya_ad: kampanya.kampanya_ad,
        baslangic: kampanya.baslangic,
        bitis: kampanya.bitis,
        indirim_orani: avgDiscount,
        totalAppointments: appointments.length,
        totalRevenue: revenue,
        potentialRevenue,
        discountAmount: Math.abs(discountAmount),
        effectiveness: appointments.length > 0 ? revenue / appointments.length : 0,
        roi: discountAmount !== 0 ? (revenue / Math.abs(discountAmount)) * 100 : 0
      };
    });

    effectiveness.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      campaigns: effectiveness,
      mostEffective: effectiveness[0] || null,
      summary: {
        totalCampaigns: campaigns.length,
        totalRevenue: effectiveness.reduce((sum, c) => sum + c.totalRevenue, 0),
        totalAppointments: effectiveness.reduce((sum, c) => sum + c.totalAppointments, 0),
        avgEffectiveness: effectiveness.length > 0 
          ? effectiveness.reduce((sum, c) => sum + c.effectiveness, 0) / effectiveness.length 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Satisfaction Analysis
router.get('/customer-satisfaction', async (req, res) => {
  try {
    const satisfactions = await prisma.memnuniyet.findMany({
      include: {
        randevu: {
          include: {
            hizmet: true
          }
        }
      }
    });

    const avgScore = satisfactions.length > 0
      ? satisfactions.reduce((sum, s) => sum + (s.puan || 0), 0) / satisfactions.length
      : 0;

    // Score distribution
    const distribution = {
      5: satisfactions.filter(s => s.puan === 5).length,
      4: satisfactions.filter(s => s.puan === 4).length,
      3: satisfactions.filter(s => s.puan === 3).length,
      2: satisfactions.filter(s => s.puan === 2).length,
      1: satisfactions.filter(s => s.puan === 1).length
    };

    // Low-scoring services (score < 3)
    const lowScoring = satisfactions
      .filter(s => s.puan && s.puan < 3)
      .map(s => ({
        memnuniyet_id: s.memnuniyet_id,
        puan: s.puan,
        yorum: s.yorum,
        hizmet: s.randevu?.hizmet?.hizmet_ad,
        tarih: s.tarih
      }));

    // Service-wise satisfaction
    const serviceSatisfaction = {};
    satisfactions.forEach(s => {
      const serviceName = s.randevu?.hizmet?.hizmet_ad || 'Unknown';
      if (!serviceSatisfaction[serviceName]) {
        serviceSatisfaction[serviceName] = { total: 0, sum: 0, scores: [] };
      }
      if (s.puan) {
        serviceSatisfaction[serviceName].total++;
        serviceSatisfaction[serviceName].sum += s.puan;
        serviceSatisfaction[serviceName].scores.push(s.puan);
      }
    });

    const serviceStats = Object.entries(serviceSatisfaction).map(([name, data]) => ({
      hizmet_ad: name,
      avgScore: data.total > 0 ? data.sum / data.total : 0,
      totalReviews: data.total,
      minScore: Math.min(...data.scores),
      maxScore: Math.max(...data.scores)
    })).sort((a, b) => a.avgScore - b.avgScore);

    res.json({
      averageScore: avgScore,
      totalReviews: satisfactions.length,
      distribution,
      lowScoringServices: lowScoring,
      serviceWiseStats: serviceStats,
      worstPerformingServices: serviceStats.slice(0, 5),
      bestPerformingServices: serviceStats.slice(-5).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// District Demand Analysis
router.get('/district-demand', async (req, res) => {
  try {
    const { year = 2025 } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const districts = await prisma.ilce.findMany({
      include: {
        musteri: {
          include: {
            randevu: {
              where: {
                tarih: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    });

    const demand = districts.map(ilce => {
      const totalAppointments = ilce.musteri.reduce((sum, m) => sum + m.randevu.length, 0);
      const totalRevenue = ilce.musteri.reduce((sum, m) => {
        return sum + m.randevu.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0);
      }, 0);
      const customerCount = ilce.musteri.length;
      
      return {
        ilce_id: ilce.ilce_id,
        ilce_ad: ilce.ilce_ad,
        nufus: ilce.nufus,
        ort_gelir: ilce.ort_gelir ? Number(ilce.ort_gelir) : 0,
        totalAppointments,
        totalRevenue,
        customerCount,
        avgAppointmentsPerCustomer: customerCount > 0 ? totalAppointments / customerCount : 0,
        avgRevenuePerCustomer: customerCount > 0 ? totalRevenue / customerCount : 0,
        demandScore: totalAppointments // Simple demand score
      };
    });

    demand.sort((a, b) => b.demandScore - a.demandScore);

    res.json({
      districts: demand,
      top10Districts: demand.slice(0, 10),
      year: parseInt(year)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Competitor Density & Investment Risk
router.get('/competitor-analysis', async (req, res) => {
  try {
    const districts = await prisma.ilce.findMany({
      include: {
        rakip_isletme: true,
        musteri: {
          include: {
            randevu: {
              where: {
                tarih: {
                  gte: new Date('2025-01-01'),
                  lte: new Date('2025-12-31')
                }
              }
            }
          }
        }
      }
    });

    const analysis = districts.map(ilce => {
      const competitorCount = ilce.rakip_isletme.length;
      const demand = ilce.musteri.reduce((sum, m) => sum + m.randevu.length, 0);
      const revenue = ilce.musteri.reduce((sum, m) => {
        return sum + m.randevu.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0);
      }, 0);
      
      // Risk calculation: high competition + low demand = high risk
      const competitionDensity = competitorCount / (ilce.nufus ? ilce.nufus / 10000 : 1); // Competitors per 10k population
      const demandPerCompetitor = competitorCount > 0 ? demand / competitorCount : demand;
      const riskScore = competitionDensity * 0.6 - (demandPerCompetitor / 100) * 0.4; // Higher = more risk
      
      return {
        ilce_id: ilce.ilce_id,
        ilce_ad: ilce.ilce_ad,
        nufus: ilce.nufus,
        competitorCount,
        competitionDensity,
        demand,
        revenue,
        demandPerCompetitor,
        riskScore: Math.max(0, Math.min(10, riskScore)), // Normalize to 0-10
        riskLevel: riskScore < 3 ? 'Low' : riskScore < 6 ? 'Medium' : 'High',
        competitors: ilce.rakip_isletme.map(r => ({
          rakip_ad: r.rakip_ad,
          hizmet_turu: r.hizmet_turu
        }))
      };
    });

    analysis.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      districts: analysis,
      highestRisk: analysis.slice(0, 5),
      lowestRisk: analysis.slice(-5).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expected Revenue & ROI for New Branch
router.get('/branch-roi', async (req, res) => {
  try {
    const { ilce_id } = req.query;
    
    if (!ilce_id) {
      return res.status(400).json({ error: 'ilce_id is required' });
    }

    const ilce = await prisma.ilce.findUnique({
      where: { ilce_id: parseInt(ilce_id) },
      include: {
        musteri: {
          include: {
            randevu: {
              where: {
                tarih: {
                  gte: new Date('2025-01-01'),
                  lte: new Date('2025-12-31')
                }
              }
            }
          }
        },
        rakip_isletme: true,
        sube: true
      }
    });

    if (!ilce) {
      return res.status(404).json({ error: 'İlçe not found' });
    }

    // Calculate current metrics
    const currentRevenue = ilce.musteri.reduce((sum, m) => {
      return sum + m.randevu.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0);
    }, 0);
    
    const currentAppointments = ilce.musteri.reduce((sum, m) => sum + m.randevu.length, 0);
    const avgAppointmentValue = currentAppointments > 0 ? currentRevenue / currentAppointments : 0;
    
    // Estimate new branch metrics (assuming 20% market capture)
    const marketCapture = 0.20;
    const expectedMonthlyAppointments = Math.floor((currentAppointments / 12) * marketCapture);
    const expectedMonthlyRevenue = expectedMonthlyAppointments * avgAppointmentValue;
    const expectedAnnualRevenue = expectedMonthlyRevenue * 12;
    
    // Estimate costs (based on existing branches if available)
    const existingBranches = await prisma.sube.findMany({
      include: {
        sube_masraf: {
          where: {
            tarih: {
              gte: new Date('2025-01-01')
            }
          }
        }
      }
    });
    
    const avgMonthlyCost = existingBranches.length > 0
      ? existingBranches.reduce((sum, b) => {
          const branchCost = b.sube_masraf.reduce((s, m) => s + (m.tutar ? Number(m.tutar) : 0), 0);
          return sum + branchCost;
        }, 0) / (existingBranches.length * 12)
      : 50000; // Default 50k TL/month
    
    const expectedAnnualCost = avgMonthlyCost * 12;
    const expectedAnnualProfit = expectedAnnualRevenue - expectedAnnualCost;
    const roi = expectedAnnualCost > 0 ? (expectedAnnualProfit / expectedAnnualCost) * 100 : 0;
    
    // Payback period (assuming initial investment of 500k TL)
    const initialInvestment = 500000;
    const paybackMonths = expectedMonthlyProfit > 0 
      ? Math.ceil(initialInvestment / expectedMonthlyProfit) 
      : null;

    res.json({
      ilce: {
        ilce_id: ilce.ilce_id,
        ilce_ad: ilce.ilce_ad,
        nufus: ilce.nufus,
        ort_gelir: ilce.ort_gelir ? Number(ilce.ort_gelir) : 0
      },
      currentMetrics: {
        annualRevenue: currentRevenue,
        annualAppointments: currentAppointments,
        avgAppointmentValue
      },
      projections: {
        marketCapture: marketCapture * 100,
        expectedMonthlyAppointments,
        expectedMonthlyRevenue,
        expectedAnnualRevenue,
        expectedMonthlyCost: avgMonthlyCost,
        expectedAnnualCost,
        expectedAnnualProfit,
        roi: roi.toFixed(2),
        initialInvestment,
        paybackMonths
      },
      riskFactors: {
        competitorCount: ilce.rakip_isletme.length,
        existingBranches: ilce.sube.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overview Dashboard Data
router.get('/overview', async (req, res) => {
  try {
    const { year = 2025 } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Total appointments
    const totalAppointments = await prisma.randevu.count({
      where: {
        tarih: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Total revenue
    const appointments = await prisma.randevu.findMany({
      where: {
        tarih: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    const totalRevenue = appointments.reduce((sum, r) => {
      return sum + (r.fiyat ? Number(r.fiyat) : 0);
    }, 0);

    // Monthly comparison
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);
      const monthAppointments = appointments.filter(r => {
        if (!r.tarih) return false;
        const date = new Date(r.tarih);
        return date >= monthStart && date <= monthEnd;
      });
      return {
        month: i + 1,
        monthName: new Date(year, i, 1).toLocaleString('tr-TR', { month: 'long' }),
        appointments: monthAppointments.length,
        revenue: monthAppointments.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0)
      };
    });

    // Service ranking
    const services = await prisma.hizmet.findMany({
      include: {
        randevu: {
          where: {
            tarih: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const serviceRanking = services.map(s => ({
      hizmet_id: s.hizmet_id,
      hizmet_ad: s.hizmet_ad,
      appointments: s.randevu.length,
      revenue: s.randevu.reduce((sum, r) => sum + (r.fiyat ? Number(r.fiyat) : 0), 0)
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // District ranking
    const districts = await prisma.ilce.findMany({
      include: {
        musteri: {
          include: {
            randevu: {
              where: {
                tarih: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    });

    const districtRanking = districts.map(d => {
      const revenue = d.musteri.reduce((sum, m) => {
        return sum + m.randevu.reduce((s, r) => s + (r.fiyat ? Number(r.fiyat) : 0), 0);
      }, 0);
      return {
        ilce_id: d.ilce_id,
        ilce_ad: d.ilce_ad,
        revenue,
        appointments: d.musteri.reduce((sum, m) => sum + m.randevu.length, 0)
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Customer segmentation
    const customers = await prisma.musteri.findMany({
      include: {
        randevu: {
          where: {
            tarih: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const segmentCounts = {
      A: customers.filter(c => c.segment === 'A').length,
      B: customers.filter(c => c.segment === 'B').length,
      C: customers.filter(c => c.segment === 'C').length,
      Other: customers.filter(c => !c.segment || !['A', 'B', 'C'].includes(c.segment)).length
    };

    res.json({
      summary: {
        totalAppointments,
        totalRevenue,
        year: parseInt(year)
      },
      monthlyComparison: monthlyData,
      serviceRanking,
      districtRanking,
      customerSegmentation: segmentCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer count by district
router.get("/musteri-ilce", async (req, res) => {
  try {
    // Use raw query to handle NULL ilce_id values properly
    const data = await prisma.$queryRaw`
      SELECT 
        COALESCE(m.ilce_id, 0) AS ilce_id,
        COUNT(*) AS sayi
      FROM musteri m
      GROUP BY m.ilce_id
      ORDER BY sayi DESC;
    `;

    const result = await Promise.all(
      data.map(async (d) => {
        if (d.ilce_id === 0 || d.ilce_id === null) {
          return {
            ilce: "Bilinmeyen İlçe",
            sayi: Number(d.sayi) || 0,
          };
        }
        const ilce = await prisma.ilce.findUnique({
          where: { ilce_id: Number(d.ilce_id) },
        });
        return {
          ilce: ilce?.ilce_ad || "Bilinmiyor",
          sayi: Number(d.sayi) || 0,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error in musteri-ilce endpoint:", err);
    res.status(500).json({ error: err.message });
  }
});

// Monthly appointment trend
router.get("/randevu-aylik", async (req, res) => {
  try {
    // Filter out NULL tarih values and handle them properly
    const data = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(tarih, '%Y-%m') AS ay,
        COUNT(*) AS sayi
      FROM randevu
      WHERE tarih IS NOT NULL
      GROUP BY ay
      ORDER BY ay;
    `;

    // Convert BigInt to Number for JSON serialization
    const formattedData = data.map(item => ({
      ay: item.ay,
      sayi: Number(item.sayi) || 0
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Error in randevu-aylik endpoint:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

