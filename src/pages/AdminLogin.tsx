import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(username, password);
    
    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Invalid administrator credentials');
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-50 text-center space-y-8">
          <div className="inline-flex p-4 bg-bloom-pink rounded-3xl text-bloom-rose">
            <ShieldCheck size={40} />
          </div>
          
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 mt-2">Enter your administrative credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-bloom-rose outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Master Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-14 pr-14 py-4 bg-gray-50 border rounded-2xl focus:bg-white outline-none transition-all ${
                    error ? 'border-red-300 ring-4 ring-red-50' : 'border-transparent focus:border-bloom-rose'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 text-red-500 text-xs font-bold justify-center"
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-all flex items-center justify-center space-x-2 shadow-xl shadow-gray-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Security Authenticate</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            bloom & blossom secure zone
          </p>
        </div>
      </motion.div>
    </div>
  );
}
