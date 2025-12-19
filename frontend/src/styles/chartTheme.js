/**
 * VenusKDS - Ortak Grafik Tema Ayarları
 * Tüm Recharts grafikleri için merkezi stil tanımları
 */

// ============================================
// RENK PALETİ
// ============================================
export const COLORS = {
  // Ana mor paleti
  primary: {
    darkest: '#4c1d95',    // En koyu mor
    darker: '#5b21b6',     // Koyu mor
    dark: '#6d28d9',       // Orta-koyu mor
    main: '#7c3aed',       // Ana mor
    light: '#8b5cf6',      // Açık mor
    lighter: '#a78bfa',    // Daha açık mor
    soft: '#c4b5fd',       // Soft mor
    pale: '#ddd6fe',       // Soluk mor
    faint: '#ede9fe',      // Çok soluk mor
    tint: '#f5f3ff',       // Mor tint
  },
  // Vurgu renkleri
  accent: {
    success: '#059669',    // Yeşil (zirve vurgu)
    danger: '#dc2626',     // Kırmızı (düşük vurgu)
    warning: '#d97706',    // Turuncu
  },
  // Nötr renkler
  neutral: {
    dark: '#374151',
    medium: '#6b7280',
    light: '#9ca3af',
    border: '#e5e7eb',
    background: '#f9fafb',
  }
};

// ============================================
// BAR RENKLERİ (Değere göre ton)
// ============================================
export const BAR_COLORS = {
  cokKoyu: COLORS.primary.main,      // #7c3aed - Max değer
  enKoyu: COLORS.primary.light,      // #8b5cf6 - >= 80%
  koyu: COLORS.primary.lighter,      // #a78bfa - >= 60%
  orta: COLORS.primary.soft,         // #c4b5fd - >= 40%
  acik: COLORS.primary.pale,         // #ddd6fe - >= 20%
  cokAcik: COLORS.primary.faint,     // #ede9fe - < 20%
};

// Bar rengi hesaplama fonksiyonu
export const getBarColor = (value, maxValue, isMax = false) => {
  if (isMax) return BAR_COLORS.cokKoyu;
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio >= 0.8) return BAR_COLORS.enKoyu;
  if (ratio >= 0.6) return BAR_COLORS.koyu;
  if (ratio >= 0.4) return BAR_COLORS.orta;
  if (ratio >= 0.2) return BAR_COLORS.acik;
  return BAR_COLORS.cokAcik;
};

// ============================================
// GRADIENT TANIMLARI (SVG defs için)
// ============================================
export const GRADIENTS = {
  // Area fill gradient (yukarıdan aşağıya şeffaflaşan)
  areaFill: {
    id: 'colorGradient',
    x1: '0', y1: '0', x2: '0', y2: '1',
    stops: [
      { offset: '0%', stopColor: COLORS.primary.main, stopOpacity: 0.15 },
      { offset: '100%', stopColor: COLORS.primary.main, stopOpacity: 0.02 },
    ]
  },
  // Line stroke gradient (soldan sağa)
  lineStroke: {
    id: 'strokeGradient',
    x1: '0', y1: '0', x2: '1', y2: '0',
    stops: [
      { offset: '0%', stopColor: COLORS.primary.lighter },
      { offset: '50%', stopColor: COLORS.primary.main },
      { offset: '100%', stopColor: COLORS.primary.dark },
    ]
  },
  // Bar fill gradient (yukarıdan aşağıya)
  barFill: {
    id: 'barGradient',
    x1: '0', y1: '0', x2: '0', y2: '1',
    stops: [
      { offset: '0%', stopColor: COLORS.primary.main, stopOpacity: 1 },
      { offset: '100%', stopColor: COLORS.primary.lighter, stopOpacity: 0.8 },
    ]
  }
};

// Gradient JSX oluşturucu
export const createGradientDef = (gradient) => ({
  id: gradient.id,
  x1: gradient.x1,
  y1: gradient.y1,
  x2: gradient.x2,
  y2: gradient.y2,
  stops: gradient.stops
});

// ============================================
// TOOLTIP STİLİ
// ============================================
export const TOOLTIP_STYLE = {
  // Premium tooltip (blur + shadow)
  premium: {
    contentStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${COLORS.primary.soft}`,
      borderRadius: '12px',
      padding: '14px 18px',
      boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
    },
    labelStyle: {
      color: COLORS.primary.darker,
      fontWeight: 700,
      fontSize: '14px',
      marginBottom: '6px'
    },
    itemStyle: {
      color: COLORS.primary.main,
      fontSize: '13px',
      fontWeight: 500
    },
    cursor: { fill: 'rgba(124, 58, 237, 0.08)' }
  },
  // Basit tooltip
  simple: {
    contentStyle: {
      backgroundColor: 'white',
      border: `1px solid ${COLORS.neutral.border}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    labelStyle: {
      color: COLORS.neutral.dark,
      fontWeight: 600,
      fontSize: '13px',
      marginBottom: '4px'
    },
    itemStyle: {
      color: COLORS.neutral.medium,
      fontSize: '12px'
    }
  }
};

// ============================================
// GRID STİLİ
// ============================================
export const GRID_STYLE = {
  // Premium dashed grid
  premium: {
    strokeDasharray: '4 4',
    stroke: COLORS.primary.soft,
    strokeOpacity: 0.2
  },
  // Dotted grid
  dotted: {
    strokeDasharray: '3 6',
    stroke: COLORS.primary.soft,
    strokeOpacity: 0.35
  },
  // Minimal grid
  minimal: {
    strokeDasharray: '3 3',
    stroke: COLORS.primary.pale,
    strokeOpacity: 0.15
  }
};

// ============================================
// EKSEN STİLLERİ
// ============================================
export const AXIS_STYLE = {
  // Premium eksen
  premium: {
    tick: {
      fill: COLORS.primary.darker,
      fontSize: 11,
      fontWeight: 500
    },
    axisLine: {
      stroke: COLORS.primary.soft,
      strokeWidth: 1
    },
    tickLine: {
      stroke: COLORS.primary.soft
    }
  },
  // Basit eksen
  simple: {
    tick: {
      fill: COLORS.neutral.medium,
      fontSize: 11,
      fontWeight: 400
    },
    axisLine: {
      stroke: COLORS.neutral.border,
      strokeWidth: 1
    },
    tickLine: {
      stroke: COLORS.neutral.border
    }
  }
};

// ============================================
// MARGIN DEĞERLERİ
// ============================================
export const CHART_MARGINS = {
  // Standart bar chart
  bar: {
    top: 10,
    right: 10,
    left: 0,
    bottom: 40
  },
  // Angled labels için
  barAngled: {
    top: 10,
    right: 10,
    left: 0,
    bottom: 60
  },
  // Line/Area chart
  line: {
    top: 10,
    right: 10,
    left: 0,
    bottom: 0
  },
  // Stacked bar
  stacked: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 60
  }
};

// ============================================
// DOT (NOKTA) STİLLERİ
// ============================================
export const DOT_STYLE = {
  // Normal nokta
  normal: {
    fill: COLORS.primary.main,
    stroke: '#fff',
    strokeWidth: 2,
    r: 4
  },
  // Aktif (hover) nokta
  active: {
    r: 8,
    fill: COLORS.primary.dark,
    stroke: COLORS.primary.soft,
    strokeWidth: 3,
    style: { filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.5))' }
  },
  // Zirve nokta
  peak: {
    outerR: 8,
    innerR: 5,
    outerFill: COLORS.primary.main,
    outerOpacity: 0.2,
    innerFill: COLORS.primary.dark,
    innerStroke: '#fff',
    innerStrokeWidth: 2
  },
  // Düşük nokta
  low: {
    outerR: 8,
    innerR: 5,
    outerFill: COLORS.accent.danger,
    outerOpacity: 0.2,
    innerFill: COLORS.accent.danger,
    innerStroke: '#fff',
    innerStrokeWidth: 2
  }
};

// ============================================
// LINE (ÇİZGİ) STİLLERİ
// ============================================
export const LINE_STYLE = {
  // Premium gradient stroke
  premium: {
    stroke: 'url(#strokeGradient)',
    strokeWidth: 3,
    type: 'monotone'
  },
  // Basit çizgi
  simple: {
    stroke: COLORS.primary.main,
    strokeWidth: 2,
    type: 'monotone'
  }
};

// ============================================
// BAR STİLLERİ
// ============================================
export const BAR_STYLE = {
  // Premium bar
  premium: {
    radius: [8, 8, 0, 0],
    maxBarWidth: 60
  },
  // Basit bar
  simple: {
    radius: [6, 6, 0, 0],
    maxBarWidth: 50
  }
};

// ============================================
// KART ARKA PLAN STİLLERİ (Tailwind classes)
// ============================================
export const CARD_CLASSES = {
  // Premium kart
  premium: 'bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 shadow-sm',
  // Basit kart
  simple: 'bg-white rounded-xl border border-gray-200',
  // Koyu kart
  dark: 'bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 shadow-sm'
};

// ============================================
// LEGEND STİLİ
// ============================================
export const LEGEND_STYLE = {
  // Alt legend
  bottom: {
    verticalAlign: 'bottom',
    align: 'center',
    wrapperStyle: {
      paddingTop: '10px'
    }
  },
  // Sağ legend
  right: {
    verticalAlign: 'middle',
    align: 'right',
    layout: 'vertical'
  }
};

// ============================================
// EMOJİ PREFİXLERİ (Tooltip için)
// ============================================
export const TOOLTIP_EMOJI = {
  location: '📍',
  calendar: '📅',
  chart: '📊',
  money: '💰',
  trend: '📈',
  target: '🎯',
  star: '⭐'
};

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

// Max değeri bul
export const getMaxValue = (data, key) => {
  return Math.max(...data.map(item => item[key] || 0), 1);
};

// Min değeri bul
export const getMinValue = (data, key) => {
  return Math.min(...data.map(item => item[key] || Infinity));
};

// Sayı formatla (bin separator)
export const formatNumber = (num) => {
  return num?.toLocaleString('tr-TR') || '0';
};

// Para formatla
export const formatCurrency = (num) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
};

// Yüzde formatla
export const formatPercent = (num, decimals = 2) => {
  return `${Number(num || 0).toFixed(decimals)}%`;
};

// ============================================
// DEFAULT EXPORT
// ============================================
const chartTheme = {
  colors: COLORS,
  barColors: BAR_COLORS,
  gradients: GRADIENTS,
  tooltip: TOOLTIP_STYLE,
  grid: GRID_STYLE,
  axis: AXIS_STYLE,
  margins: CHART_MARGINS,
  dot: DOT_STYLE,
  line: LINE_STYLE,
  bar: BAR_STYLE,
  card: CARD_CLASSES,
  legend: LEGEND_STYLE,
  emoji: TOOLTIP_EMOJI,
  utils: {
    getBarColor,
    getMaxValue,
    getMinValue,
    formatNumber,
    formatCurrency,
    formatPercent,
    createGradientDef
  }
};

export default chartTheme;

