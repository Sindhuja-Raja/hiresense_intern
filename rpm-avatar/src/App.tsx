/**
 * App Component
 * 
 * Main application component that orchestrates the 3D scene and UI controls.
 * Manages the gesture state that controls avatar animations.
 */

import { useState } from 'react';
import { Scene } from './components';
import { InterviewPanel } from './components/InterviewPanel';
import type { GestureState } from './types';
import './App.css';

function App() {
  /**
   * Gesture State Management
   * 
   * This state controls which animation the avatar is performing:
   * - 'idle': Default relaxed state
   * - 'speaking': Active talking animation
   * - 'listening': Attentive listening pose
   */
  const [gestureState, setGestureState] = useState<GestureState>('idle');

  return (
    <div className="app">
      {/* 
        3D Scene Container
        The Scene component sets up the Three.js canvas with the avatar
      */}
      <Scene gestureState={gestureState} />
      
      {/* 
        Candidate Camera Container
        The webcam feed will be rendered here via portal
      */}
      <div id="candidate-camera" className="candidate-camera-container"></div>
      
      {/* 
        Interview Panel
        Handles speech-to-text, AI responses, and text-to-speech
      */}
      <InterviewPanel onGestureChange={setGestureState} />
      
      {/* Header with title */}
      <header className="app-header">
        <h1>AI HR Interviewer</h1>
        <p>Speak with Sarah, your virtual interviewer</p>
      </header>
    </div>
  );
}

export default App;
