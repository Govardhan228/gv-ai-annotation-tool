import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Eye, EyeOff, LogIn, UserPlus, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const { darkMode, signIn, signUp } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      const { error: err } = await signUp(email, password, name || 'Govardhan');
      if (err) setError(err);
      else setSuccess('Account created! You can now log in.');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">GV</span>
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>GV.AI Annotation Platform</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise-grade data annotation</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {/* Tabs */}
          <div className={`flex border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isLogin
                  ? (darkMode ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50')
                  : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isLogin
                  ? (darkMode ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50')
                  : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle size={14} /> {success}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Govardhan"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            )}

            <div>
              <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                required
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-10 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={15} /> Log In</>
              ) : (
                <><UserPlus size={15} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className={`text-center text-xs mt-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          By using GV.AI, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
