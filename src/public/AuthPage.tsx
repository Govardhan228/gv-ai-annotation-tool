import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Chrome, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Props {
  mode: 'login' | 'register';
  onBack: () => void;
  onSuccess: () => void;
  onToggle: () => void;
}

export default function AuthPage({ mode, onBack, onSuccess, onToggle }: Props) {
  const dm = useAppStore((s) => s.darkMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 800);
  };

  return (
    <div className={`min-h-screen flex ${dm ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-12 justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 40%), radial-gradient(circle at 70% 80%, white 0%, transparent 40%)' }} />
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to website
          </button>
        </div>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-lg">GV</span>
            </div>
            <span className="font-bold text-xl">GV.AI</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {isRegister ? 'Start annotating at enterprise scale' : 'Welcome back to GV.AI'}
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-md">
            The complete annotation platform for 2D images, video, 3D LiDAR, and multi-camera data with AI-assisted labeling.
          </p>
          <div className="space-y-3">
            {[
              'AI-assisted annotation with 80% time savings',
              'Built-in QA validation engine',
              'Multi-camera tracking with shared track IDs',
              'COCO, YOLO, KITTI, CVAT format support',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-white/90 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex gap-6 text-white/60 text-xs">
          <span>500M+ annotations</span>
          <span>99.2% QA accuracy</span>
          <span>10,000+ annotators</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center"><span className="text-white font-bold text-xs">GV</span></div>
            <span className="font-bold text-base">GV.AI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">{isRegister ? 'Create your account' : 'Sign in to your account'}</h2>
          <p className={`text-sm mb-6 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
            {isRegister ? 'Start your 14-day free trial. No credit card required.' : 'Enter your credentials to access the platform.'}
          </p>

          {/* SSO buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={onSuccess} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <Chrome size={16} /> Google
            </button>
            <button onClick={onSuccess} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${dm ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z"/></svg> Microsoft
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className={`flex-1 h-px ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>or continue with email</span>
            <div className={`flex-1 h-px ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                <div className="relative mt-1">
                  <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dm ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Jane Doe" required
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                </div>
              </div>
            )}
            <div>
              <label className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
              <div className="relative mt-1">
                <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dm ? 'text-slate-500' : 'text-slate-400'}`} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" required
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`} />
              </div>
            </div>
            <div>
              <label className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
              <div className="relative mt-1">
                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dm ? 'text-slate-500' : 'text-slate-400'}`} />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Remember me</span>
                </label>
                <a href="#" className="text-blue-500 hover:text-blue-600">Forgot password?</a>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center text-xs">
            <span className={dm ? 'text-slate-400' : 'text-slate-500'}>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button onClick={onToggle} className="ml-1 text-blue-500 hover:text-blue-600 font-medium">{isRegister ? 'Sign in' : 'Sign up'}</button>
          </div>

          {/* Role info for registration */}
          {isRegister && (
            <div className={`mt-6 p-3 rounded-lg ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-xs font-medium">Available roles</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Super Admin', 'Project Manager', 'Team Lead', 'QA Reviewer', 'Annotator', 'Client Viewer'].map((r) => (
                  <span key={r} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dm ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>{r}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-1 text-xs opacity-50">
            <ShieldCheck size={12} /> Protected by enterprise security · SSO & MFA ready
          </div>
        </div>
      </div>
    </div>
  );
}
