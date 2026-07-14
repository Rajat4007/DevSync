import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GitBranch, ArrowRight } from 'lucide-react';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-12 font-sans selection:bg-violet-500 selection:text-white relative overflow-hidden">
      
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 -z-10 rounded-full bg-violet-700/5 blur-[80px]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/6 bg-[#111118] p-8 shadow-2xl shadow-black/80">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-900/40">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create your account
          </h1>
        </div>

        {/* ── OAUTH BUTTONS SECTION ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button 
            type="button"
            onClick={() => console.log('Google register clicked')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/2 border border-white/6 hover:border-white/20 hover:bg-white/4 px-4 py-2.5 text-[13px] font-medium text-white/80 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </button>
          
          <button 
            type="button"
            onClick={() => console.log('GitHub register clicked')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/2 border border-white/6 hover:border-white/20 hover:bg-white/4 px-4 py-2.5 text-[13px] font-medium text-white/80 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.003 1.003.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="grow border-t border-white/4"></div>
          <span className="shrink mx-3 text-[11px] font-medium uppercase tracking-wider text-white/20">or continue with</span>
          <div className="grow border-t border-white/4"></div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/15 p-3 text-xs font-medium text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:outline-none focus:border-violet-500 focus:bg-white/5 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:outline-none focus:border-violet-500 focus:bg-white/5 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:outline-none focus:border-violet-500 focus:bg-white/5 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none focus:outline-none focus:border-violet-500 focus:bg-white/5 transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-3 rounded-xl text-[14px] transition-all shadow-xl shadow-violet-900/40 group cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Creating account...' : 'Get Started'}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 hover:underline transition-colors">
            Sign In
          </Link>
        </p>

        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-violet-600/10 blur-xl rounded-full -z-10" />
      </div>
    </div>
  );
}

export default Register;