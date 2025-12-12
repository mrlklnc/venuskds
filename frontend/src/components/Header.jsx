import { Menu, X, Sparkles } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="bg-white border-b border-purple-100 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-center px-6 py-4 relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden absolute left-6 text-purple-600 hover:text-purple-700 transition-colors duration-200"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-2 rounded-lg shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Venüs Güzellik Salonu Admin Paneli
          </h2>
        </div>
      </div>
    </header>
  );
}
