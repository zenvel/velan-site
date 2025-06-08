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
      className="absolute inset-0 -z-10"
    />
  );
}