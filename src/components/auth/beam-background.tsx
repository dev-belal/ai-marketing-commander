const BEAMS = [
  { left: '10%', delay: '0s', width: '1px' },
  { left: '25%', delay: '1.5s', width: '1px' },
  { left: '40%', delay: '3s', width: '2px' },
  { left: '55%', delay: '4.5s', width: '1px' },
  { left: '70%', delay: '6s', width: '1px' },
  { left: '85%', delay: '7.5s', width: '2px' },
]

function BeamBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Beams */}
      {BEAMS.map((beam, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: beam.left,
            top: 0,
            width: beam.width,
            height: '100vh',
            background:
              'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.3) 40%, rgba(6,182,212,0.2) 60%, transparent 100%)',
            transform: 'rotate(25deg)',
            transformOrigin: 'top center',
            animation: `beamSweep 8s ease-in-out infinite`,
            animationDelay: beam.delay,
            opacity: 0,
          }}
        />
      ))}

      {/* Edge fade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, #080B14 0%, transparent 15%, transparent 85%, #080B14 100%)',
          zIndex: 1,
        }}
      />

      <style>{`
        @keyframes beamSweep {
          0% { opacity: 0; transform: rotate(25deg) translateY(-100%); }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; transform: rotate(25deg) translateY(100%); }
        }
      `}</style>
    </div>
  )
}

export { BeamBackground }