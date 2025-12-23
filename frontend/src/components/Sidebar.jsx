import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Calculator,
  Map,
  FileText,
  LogOut,
  Sparkles,
} from 'lucide-react';

const SalonLogo = () => (
  <div className="flex items-center justify-center mb-4">
    <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-2 rounded-xl shadow-lg">
      <Sparkles className="w-6 h-6 text-white" />
    </div>
  </div>
);

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analizler', label: 'Karar Destek Analizleri', icon: BarChart3 },
    { path: '/simulasyon', label: 'Şube Açma Simülasyonu', icon: Building2 },
    { path: '/finansal-senaryolar', label: 'Finansal Senaryolar', icon: Calculator },
    { path: '/harita', label: 'Harita (CBS Analizi)', icon: Map },
    { path: '/karar-ozeti', label: 'Yönetici Karar Özeti', icon: FileText },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-600 to-purple-800 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{ boxShadow: '4px 0 20px rgba(124, 58, 237, 0.3)' }}
    >
      <div className="p-6 border-b border-purple-500/30">
        <SalonLogo />
        <h1 className="text-xl font-semibold text-white text-center">
          Venüs Güzellik Salonu
        </h1>
        <p className="text-xs text-purple-200 mt-1 text-center">
          Yönetim Paneli
        </p>
      </div>

      <nav className="px-4 py-4 overflow-y-auto h-[calc(100vh-140px)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-purple-200'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 w-full transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
