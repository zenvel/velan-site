'use client';
import Particles from 'react-tsparticles';
export default function ParticleBg() {
  return (
    <Particles
      options={{
        fullScreen: { enable: false },
        particles: {
          number: { value: 60 },
          size: { value: 2 },
          color: { value: '#60a5fa' },
          links: { enable: false },
          move: { enable: true, speed: 0.3 }
        }
      }}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        filter: 'blur(1px)',
        opacity: 0.7
      }}
    />
  );
}