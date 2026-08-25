/**
 * Avatar Configuration
 * 
 * Central configuration for 3D avatar models used in the Virtual Interview.
 * Easily switch between different avatar models and adjust their properties.
 */

export interface AvatarConfig {
  // Model file path (relative to public folder)
  modelUrl: string;
  
  // Display name for the avatar
  name: string;
  
  // Optional: Model-specific visual adjustments
  scale?: number;
  position?: [number, number, number];
  yawOffset?: number; // radians
  
  // Optional: Camera settings optimized for this model
  // NOTE: The scene now auto-fits camera to the loaded model bounds.
  // Keep this only for intentional overrides.
  camera?: {
    position: [number, number, number];
    fov: number;
  };
  
  // Optional: Model capabilities/features
  features?: {
    hasMorphTargets: boolean;
    hasFullBody: boolean;
    supportedAnimations: string[];
  };
}

// Available avatar models
export const AVATAR_MODELS: Record<string, AvatarConfig> = {
  professional_male: {
    modelUrl: '/man.glb',
    name: 'Professional Male Interviewer',
    // Keep these neutral; the scene auto-centers and auto-fits camera.
    scale: 1,
    position: [0, 0, 0],
    yawOffset: -Math.PI / 2,
    features: {
      hasMorphTargets: true,
      hasFullBody: true,
      supportedAnimations: ['idle', 'speaking', 'listening'],
    },
  },
  
  // Fallback model (keep for backwards compatibility)
  default: {
    modelUrl: '/avatar.glb',
    name: 'Default Interviewer',
    scale: 1,
    position: [0, 0, 0],
    camera: {
      position: [0, 1.55, 0.9],
      fov: 28,
    },
    features: {
      hasMorphTargets: true,
      hasFullBody: false,
      supportedAnimations: ['idle', 'speaking', 'listening'],
    },
  },
};

// Active avatar selection
// Change this to switch between different avatars
export const ACTIVE_AVATAR: keyof typeof AVATAR_MODELS = 'professional_male'; // Using man.glb

// Get current avatar configuration
export const getAvatarConfig = (): AvatarConfig => {
  return AVATAR_MODELS[ACTIVE_AVATAR] || AVATAR_MODELS.default;
};

// Export commonly used values for convenience
export const AVATAR_URL = getAvatarConfig().modelUrl;
export const AVATAR_CAMERA_CONFIG = getAvatarConfig().camera;
