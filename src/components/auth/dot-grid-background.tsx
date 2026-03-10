function DotGridBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(37,99,235,0.25) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Sweeping glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'dotSweep 20s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes dotSweep {
          0% { background: radial-gradient(ellipse 60% 40% at 20% 20%, rgba(37,99,235,0.08), transparent 60%); }
          25% { background: radial-gradient(ellipse 60% 40% at 80% 30%, rgba(37,99,235,0.08), transparent 60%); }
          50% { background: radial-gradient(ellipse 60% 40% at 70% 80%, rgba(37,99,235,0.08), transparent 60%); }
          75% { background: radial-gradient(ellipse 60% 40% at 20% 70%, rgba(37,99,235,0.08), transparent 60%); }
          100% { background: radial-gradient(ellipse 60% 40% at 20% 20%, rgba(37,99,235,0.08), transparent 60%); }
        }
      `}</style>
    </div>
  )
}

export { DotGridBackground }