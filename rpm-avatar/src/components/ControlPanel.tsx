/**
 * ControlPanel Component
 * 
 * UI overlay with buttons to switch between avatar gesture states.
 * Positioned at the bottom of the screen with a clean, modern design.
 */

import type { GestureState } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  currentState: GestureState;
  onStateChange: (state: GestureState) => void;
}

export function ControlPanel({ currentState, onStateChange }: ControlPanelProps) {
  // Define the available gesture states with their display info
  const states: { value: GestureState; label: string; emoji: string }[] = [
    { value: 'idle', label: 'Idle', emoji: '😌' },
    { value: 'speaking', label: 'Speaking', emoji: '🗣️' },
    { value: 'listening', label: 'Listening', emoji: '👂' },
  ];

  return (
    <div className="control-panel">
      <div className="control-panel-content">
        <h3 className="control-title">Avatar State</h3>
        <div className="button-group">
          {states.map((state) => (
            <button
              key={state.value}
              className={`state-button ${currentState === state.value ? 'active' : ''}`}
              onClick={() => onStateChange(state.value)}
            >
              <span className="button-emoji">{state.emoji}</span>
              <span className="button-label">{state.label}</span>
            </button>
          ))}
        </div>
        <p className="state-description">
          {getStateDescription(currentState)}
        </p>
      </div>
    </div>
  );
}

/**
 * Returns a description of what each state does
 */
function getStateDescription(state: GestureState): string {
  switch (state) {
    case 'idle':
      return 'Subtle breathing motion with gentle sway';
    case 'speaking':
      return 'Active head movement with mouth animation';
    case 'listening':
      return 'Attentive head tilts and occasional nods';
  }
}
