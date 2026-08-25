/**
 * Simple Test Scene Component
 * 
 * A minimal 3D scene to test React Three Fiber compatibility
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

export function SimpleTestScene() {
  return (
    <div style={{ width: '400px', height: '400px' }}>
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}
