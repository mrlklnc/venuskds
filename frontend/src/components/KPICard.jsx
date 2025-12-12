import { Star, Sparkles } from 'lucide-react';

export default function KPICard({ title, value, icon: Icon, trend, subtitle, color = 'purple' }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-white to-purple-50/30 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
      {/* Purple gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-purple-600/70 mb-1">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-purple-500/60 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
