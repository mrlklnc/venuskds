import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Building2,
  Gift,
  Receipt,
  Brain,
  LogOut,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
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
  const [analizlerOpen, setAnalizlerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if any analiz route is active
  const isAnalizActive = ['/analizler', '/musteri', '/hizmet', '/rakip', '/kampanya'].includes(location.pathname);
  
  // Auto-expand Analizler if one of its subpages is active
  useEffect(() => {
    if (isAnalizActive && location.pathname !== '/analizler') {
      setAnalizlerOpen(true);
    }
  }, [isAnalizActive, location.pathname]);

  const analizSubmenu = [
    { path: '/musteri', label: 'Müşteri Analizi', icon: Users },
    { path: '/hizmet', label: 'Hizmet Performansı', icon: Sparkles },
    { path: '/rakip', label: 'Rakip Analizi', icon: Building2 },
    { path: '/kampanya', label: 'Kampanya Analizi', icon: Gift },
  ];

  const mainMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      type: 'submenu',
      label: 'Analizler', 
      icon: BarChart3,
      submenu: analizSubmenu,
      mainPath: '/analizler'
    },
    { path: '/dss', label: 'Şube Açma Karar Modülü', icon: TrendingUp },
    { path: '/masraf', label: 'Şube Masrafları & Karlılık', icon: Receipt },
    { path: '/dss', label: 'Tam Karar Destek Paneli', icon: Brain },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-600 to-purple-800 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{
        boxShadow: '4px 0 20px rgba(124, 58, 237, 0.3)',
      }}
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
        {mainMenuItems.map((item, index) => {
          if (item.type === 'submenu') {
            const isActive = location.pathname === item.mainPath || isAnalizActive;
            return (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-1">
                  <Link
                    to={item.mainPath}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      location.pathname === item.mainPath
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${location.pathname === item.mainPath ? 'text-white' : 'text-purple-200'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                  <button
                    onClick={() => setAnalizlerOpen(!analizlerOpen)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-purple-200 hover:bg-white/10'
                    }`}
                  >
                    {analizlerOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {analizlerOpen && (
                  <div className="mt-2 ml-4 space-y-1">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? 'bg-white/25 text-white shadow-md'
                              : 'text-purple-100 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <SubIcon className={`w-5 h-5 ${isSubActive ? 'text-white' : 'text-purple-200'}`} />
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
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
          }
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
