/**
 * Avatar Type Definitions
 * 
 * Central location for avatar-related TypeScript types.
 */

/**
 * GestureState - Defines the three possible animation states for the avatar
 * 
 * - 'idle': Default state with subtle breathing/movement
 * - 'speaking': Active speaking with head movement and mouth animation
 * - 'listening': Attentive listening with head tilts and nods
 */
export type GestureState = 'idle' | 'speaking' | 'listening';
