/**
 * Avatar Component
 * 
 * This component loads and displays the Ready Player Me 3D avatar model.
 * It handles the GLB model loading and applies animations based on the current gesture state.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { GestureState } from '../types';

// Props interface for the Avatar component
interface AvatarProps {
  gestureState: GestureState;
}

// URL for the Ready Player Me avatar model
const AVATAR_URL = 'https://models.readyplayer.me/695742ce452afe2bbf7a6a4c.glb';

export function Avatar({ gestureState }: AvatarProps) {
  // Load the GLB model using drei's useGLTF hook
  const { scene } = useGLTF(AVATAR_URL);
  
  // Reference to the model group for animations
  const groupRef = useRef<THREE.Group>(null);
  
  // References for specific bones/meshes we'll animate
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const meshesWithMorphTargets = useRef<THREE.SkinnedMesh[]>([]);
  
  // Animation timing references
  const timeRef = useRef(0);
  const speakingPhaseRef = useRef(0);

  // Find and store references to bones and morph target meshes on mount
  useEffect(() => {
    if (scene) {
      // Clone the scene to avoid issues with reusing the same model
      scene.traverse((child) => {
        // Find the head bone for head movements
        if (child instanceof THREE.Bone && child.name.toLowerCase().includes('head')) {
          headBoneRef.current = child;
        }
        
        // Find meshes with morph targets (for facial animation)
        if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
          meshesWithMorphTargets.current.push(child)
        }
      });
      
      // Apply friendly smile expression
      applySmileExpression(meshesWithMorphTargets.current);
    }
  }, [scene]);

  // Animation loop - runs every frame
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    const head = headBoneRef.current;
    const time = timeRef.current;
    
    // Apply different animations based on gesture state
    switch (gestureState) {
      case 'idle':
        animateIdle(head, time, meshesWithMorphTargets.current);
        break;
      case 'speaking':
        speakingPhaseRef.current += delta;
        animateSpeaking(head, time, meshesWithMorphTargets.current, speakingPhaseRef.current);
        break;
      case 'listening':
        animateListening(head, time, meshesWithMorphTargets.current);
        break;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 
        Render the loaded 3D model
        - position: adjusted to frame upper body/bust view like reference image
        - scale: adjusted for proper viewing
      */}
      <primitive 
        object={scene} 
        position={[0, 0, 0]} 
        scale={1}
      />
    </group>
  );
}

/**
 * Idle Animation
 * Professional, confident posture with subtle natural movements
 */
function animateIdle(
  head: THREE.Bone | null, 
  time: number,
  meshes: THREE.SkinnedMesh[]
) {
  if (head) {
    // Very subtle breathing motion - gentle and professional
    head.rotation.x = Math.sin(time * 0.4) * 0.015;
    // Minimal natural sway - confident and still
    head.rotation.y = Math.sin(time * 0.25) * 0.008;
    head.rotation.z = Math.sin(time * 0.3) * 0.003;
  }
  
  // Keep slight smile during idle
  setMouthOpenness(meshes, 0);
}

/**
 * Speaking Animation
 * Natural head movement while speaking - like an HR interviewer explaining something
 */
function animateSpeaking(
  head: THREE.Bone | null, 
  time: number,
  meshes: THREE.SkinnedMesh[],
  speakingTime: number
) {
  if (head) {
    // Natural head movements while speaking - expressive but professional
    // Slight nod emphasis on words
    head.rotation.x = Math.sin(time * 1.5) * 0.04 + Math.sin(time * 3) * 0.02;
    // Gentle side-to-side for emphasis
    head.rotation.y = Math.sin(time * 1.2) * 0.06;
    // Very subtle tilt
    head.rotation.z = Math.sin(time * 0.8) * 0.015;
  }
  
  // Mouth animation - natural speech pattern
  const mouthValue = 
    Math.abs(Math.sin(speakingTime * 6)) * 0.25 +
    Math.abs(Math.sin(speakingTime * 10)) * 0.25 +
    Math.abs(Math.sin(speakingTime * 4)) * 0.15;
  
  setMouthOpenness(meshes, Math.min(mouthValue, 0.6));
}

/**
 * Listening Animation
 * Attentive HR interviewer - engaged listening with occasional nods
 */
function animateListening(
  head: THREE.Bone | null, 
  time: number,
  meshes: THREE.SkinnedMesh[]
) {
  if (head) {
    // Slight interested head tilt
    head.rotation.z = Math.sin(time * 0.3) * 0.03 + 0.04;
    
    // Occasional understanding nods - every 3 seconds
    const nodCycle = time % 3;
    if (nodCycle < 0.4) {
      // Gentle nod
      head.rotation.x = Math.sin(nodCycle * Math.PI * 2.5) * 0.08;
    } else {
      // Return to attentive position with slight movement
      head.rotation.x = Math.sin(time * 0.4) * 0.015 + 0.02;
    }
    
    // Very subtle lateral movement - engaged but not distracted
    head.rotation.y = Math.sin(time * 0.35) * 0.02;
  }
  
  // Neutral attentive expression
  setMouthOpenness(meshes, 0);
}

/**
 * Helper function to set mouth openness using morph targets
 * Ready Player Me avatars use "mouthOpen" or "jawOpen" morph targets
 */
function setMouthOpenness(meshes: THREE.SkinnedMesh[], value: number) {
  meshes.forEach((mesh) => {
    if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      // Try different morph target names that RPM avatars might use
      const mouthTargets = ['mouthOpen', 'jawOpen', 'viseme_aa', 'viseme_O'];
      
      for (const targetName of mouthTargets) {
        const index = mesh.morphTargetDictionary[targetName];
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = value;
        }
      }
    }
  });
}

/**
 * Apply friendly smile expression using morph targets
 */
function applySmileExpression(meshes: THREE.SkinnedMesh[]) {
  meshes.forEach((mesh) => {
    if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      // Smile morph targets
      const smileTargets = ['mouthSmile', 'mouthSmileLeft', 'mouthSmileRight', 'smile'];
      for (const targetName of smileTargets) {
        const index = mesh.morphTargetDictionary[targetName];
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = 0.5; // Natural smile intensity
        }
      }
      
      // Slightly raised cheeks for natural smile
      const cheekTargets = ['cheekSquintLeft', 'cheekSquintRight'];
      for (const targetName of cheekTargets) {
        const index = mesh.morphTargetDictionary[targetName];
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = 0.3;
        }
      }
      
      // Slightly happy eyes
      const eyeTargets = ['eyeSquintLeft', 'eyeSquintRight'];
      for (const targetName of eyeTargets) {
        const index = mesh.morphTargetDictionary[targetName];
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = 0.2;
        }
      }
    }
  });
}

// Preload the model for better performance
useGLTF.preload(AVATAR_URL);
