import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export const DynamicMeshGradient: React.FC = () => {
  return (
    <>
      <ShaderGradientCanvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -2,
          pointerEvents: 'none',
        }}
      >
        <ShaderGradient
          control="props"
          type="waterPlane"
          animate="on"
          color1="#ff0055"
          color2="#dc2626"
          color3="#08080a"
          brightness={1.1}
          uDensity={1.2}
          uFrequency={5.5}
          uSpeed={0.12}
          grain="on"
          cDistance={3.6}
          cPolarAngle={90}
          cAzimuthAngle={180}
          cameraZoom={1.0}
        />
      </ShaderGradientCanvas>

      {/* Radial vignette mask matching SignalScout exactly */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(8, 8, 10, 0.95) 100%)'
        }}
      />
    </>
  );
};
