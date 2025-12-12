import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles } from 'lucide-react';

// Elegant Beauty Salon Logo Component
const BeautyLogo = () => (
  <div className="flex items-center justify-center mb-6">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
      <div className="relative bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-2xl shadow-lg">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
);

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Kullanıcı adı veya şifre hatalı!');
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md border border-purple-100/50 animate-float">
        <div className="text-center mb-10">
          <BeautyLogo />
          <h1 className="text-4xl md:text-5xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Venüs Güzellik Salonu
          </h1>
          <p className="text-lg font-medium text-purple-600/70">
            Admin Paneli
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 transition-all duration-200 outline-none"
              placeholder="Kullanıcı adınızı girin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 transition-all duration-200 outline-none"
              placeholder="Şifrenizi girin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
