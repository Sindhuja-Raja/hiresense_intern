/**
 * Scene Component
 * 
 * Sets up the 3D scene with proper lighting and camera for an
 * interview-style professional view of the avatar.
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Avatar } from './Avatar';
import type { GestureState } from '../types';

interface SceneProps {
  gestureState: GestureState;
}

export function Scene({ gestureState }: SceneProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #2d3436 0%, #4a5568 50%, #636e72 100%)'
    }}>
      <div style={{
        width: '1000px',
        height: '1000px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <Canvas
          // Camera setup for upper body only (no hands visible)
          camera={{ 
            position: [0, 1.55, 0.9], 
            fov: 28,
            near: 0.1,
            far: 100
          }}
          // Enable shadows for more realistic rendering
          shadows
          // Optimize performance
          dpr={[1, 2]} // Device pixel ratio (min, max)
          style={{ 
            width: '100%', 
            height: '100%',
            background: 'linear-gradient(180deg, #3d4a4f 0%, #4a5568 100%)'
          }}
        >
          {/* Suspense wrapper for async model loading */}
          <Suspense fallback={<LoadingIndicator />}>
            {/* Professional interview-style lighting setup */}
            <Lighting />
            
            {/* The 3D avatar */}
            <Avatar gestureState={gestureState} />
            
            {/* Environment map for realistic reflections */}
            <Environment preset="city" />
          </Suspense>

          {/* 
            OrbitControls for camera manipulation
            - Allows user to rotate around avatar
          */}
          <OrbitControls 
            target={[0, 1.55, 0]}
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
          />
        </Canvas>
      </div>
    </div>
  );
}

/**
 * Lighting Component
 * Professional three-point lighting setup for interview-style look
 */
function Lighting() {
  return (
    <>
      {/* Ambient light - base illumination to prevent harsh shadows */}
      <ambientLight intensity={0.4} />
      
      {/* 
        Key Light - Main light source (front-right)
        This is the primary light that illuminates the face
      */}
      <directionalLight
        position={[2, 3, 2]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* 
        Fill Light - Softens shadows (front-left)
        Lower intensity than key light for natural look
      */}
      <directionalLight
        position={[-2, 2, 2]}
        intensity={0.6}
        color="#e0e8ff"
      />
      
      {/* 
        Back/Rim Light - Creates separation from background
        Adds a subtle glow around the silhouette
      */}
      <directionalLight
        position={[0, 2, -3]}
        intensity={0.5}
        color="#ffeedd"
      />
      
      {/* 
        Point light for subtle face highlights
        Positioned to add catchlights in the eyes
      */}
      <pointLight
        position={[0, 1, 2]}
        intensity={0.3}
        color="#ffffff"
      />
    </>
  );
}

/**
 * Loading Indicator
 * Shows while the 3D model is being loaded
 */
function LoadingIndicator() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#4a90d9" wireframe />
    </mesh>
  );
}
