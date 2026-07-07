import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Eye, EyeOff, LogIn, UserPlus, CheckCircle, ArrowRight, Shield, Cpu, Car, Mail, KeyRound, X, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const { darkMode, signIn, signUp, resetPassword } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Check for auth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam && errorDescription) {
      setError(decodeURIComponent(errorDescription));
    }

    // Check for password reset token
    const accessToken = params.get('access_token');
    const type = params.get('type');
    if (type === 'recovery' && accessToken) {
      // Password reset flow - would need a separate reset page
      setShowForgotPassword(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: err } = await signIn(email, password);
        if (err) {
          console.error('Login error:', err);
          // Format error messages for better UX
          if (err.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (err.includes('Email not confirmed')) {
            setError('Please verify your email address before logging in.');
          } else if (err.includes('Too many requests')) {
            setError('Too many login attempts. Please wait a moment and try again.');
          } else {
            setError(err);
          }
        }
      } else {
        const { error: err } = await signUp(email, password, name || 'User');
        if (err) {
          console.error('Signup error:', err);
          if (err.includes('already registered')) {
            setError('An account with this email already exists. Try logging in instead.');
          } else if (err.includes('Password')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(err);
          }
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.');
        }
      }
    } catch (err: any) {
      console.error('Auth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      const { error: err, success: ok } = await resetPassword(resetEmail);
      if (err) {
        console.error('Reset password error:', err);
        if (err.includes('not found')) {
          setResetError('No account found with this email address.');
        } else {
          setResetError(err);
        }
      } else if (ok) {
        setResetSuccess(true);
      }
    } catch (err: any) {
      console.error('Reset password exception:', err);
      setResetError('Failed to send reset email. Please try again.');
    }

    setResetLoading(false);
  };

  const features = [
    { icon: Car, text: 'Vehicle & pedestrian detection' },
    { icon: Cpu, text: 'LiDAR point cloud annotation' },
    { icon: Shield, text: 'Enterprise-grade security' },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50'}`}>
      {/* Left panel - Branding with autonomous vehicle theme */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient - Waymo-inspired */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

        {/* Animated grid lines - representing roads */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Car size={24} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AutoAnnotate</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Autonomous Vehicle Dataset Annotation
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Build high-quality training data for self-driving AI. Label vehicles, pedestrians, cyclists, and road infrastructure with precision tools.
          </p>

          <div className="mt-8 space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                  <f.icon size={18} />
                </div>
                <span className="font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats similar to Waymo's safety stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <div className="text-2xl font-bold text-cyan-400">99.5%</div>
              <div className="text-xs text-white/60 mt-1">Label accuracy</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <div className="text-2xl font-bold text-cyan-400">10X</div>
              <div className="text-xs text-white/60 mt-1">Faster labeling</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <div className="text-2xl font-bold text-cyan-400">50M+</div>
              <div className="text-xs text-white/60 mt-1">Frames annotated</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          Trusted by leading autonomous vehicle companies
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Car size={26} className="text-white" />
            </div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>AutoAnnotate</h1>
          </div>

          {/* Card */}
          <div className={`rounded-2xl border shadow-2xl overflow-hidden backdrop-blur transition-all animate-fade-in-scale ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
            {/* Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                  isLogin
                    ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                    : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                }`}
              >
                Log In
                {isLogin && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500`} />
                )}
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                  !isLogin
                    ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                    : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                }`}
              >
                Sign Up
                {!isLogin && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500`} />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl text-sm bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-start gap-2 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 rounded-xl text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-start gap-2 animate-fade-in">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-300'
                    }`}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-300'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLogin ? 'Enter password' : 'Create a password'}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 pr-11 ${
                      darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isLogin && (
                  <p className={`text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Must be at least 6 characters</p>
                )}
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Remember me</span>
                  </label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className={`text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl btn-press group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn size={16} /> Log In
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Create Account
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className={`px-6 pb-6 text-center ${isLogin ? '' : 'pt-2 border-t ' + (darkMode ? 'border-slate-800' : 'border-slate-100')}`}>
              {isLogin && (
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Don't have an account?{' '}
                  <button onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }} className={`font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    Sign up free
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className={`text-center text-[10px] mt-6 ${darkMode ? 'text-slate-700' : 'text-slate-400'}`}>
            By continuing, you agree to our{' '}
            <span className={darkMode ? 'text-slate-500' : 'text-slate-600'}>Terms of Service</span>
            {' '}and{' '}
            <span className={darkMode ? 'text-slate-500' : 'text-slate-600'}>Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)}>
          <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur animate-fade-in-scale`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-600/20' : 'bg-blue-50'}`}>
                  <KeyRound size={18} className="text-blue-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Reset Password</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>We'll send you a reset link</p>
                </div>
              </div>
              <button onClick={() => setShowForgotPassword(false)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={16} />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                  <Mail size={24} className="text-emerald-500" />
                </div>
                <h4 className={`text-base font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Check your email</h4>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  We've sent a password reset link to <span className="font-semibold">{resetEmail}</span>
                </p>
                <p className={`text-xs mt-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Didn't receive it? Check your spam folder or wait a few minutes.
                </p>
                <button onClick={() => setShowForgotPassword(false)} className="mt-5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all">
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                {resetError && (
                  <div className="p-3 rounded-xl text-sm bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-start gap-2 animate-fade-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email Address</label>
                  <input
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    type="email"
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <button type="submit" disabled={resetLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50">
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail size={16} /> Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
