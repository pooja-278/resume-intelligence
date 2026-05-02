export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center mesh-bg relative overflow-hidden">
      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-40" />

      {/* Animated orbs */}
      <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-cyan-500/10 blur-[130px] animate-float" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[130px] animate-float delay-500" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full bg-teal-400/6 blur-[80px]" />

      {/* Decorative lines */}
      <div className="absolute top-8 left-8 w-px h-24 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute top-8 left-8 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-8 right-8 w-px h-24 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-8 right-8 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="z-10 w-full max-w-md px-4">
        {/* Brand header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-5 glow-teal">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Resume Intelligence
          </h1>
          <p className="text-sm text-white/40 tracking-widest uppercase font-mono">AI-Powered ATS Scoring</p>
        </div>

        {children}

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8 animate-fade-in delay-500">
          Secured with end-to-end encryption
        </p>
      </div>
    </div>
  );
}
