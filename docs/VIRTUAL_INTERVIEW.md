# Virtual Interview Integration

## Overview
The HireSense platform now includes a comprehensive 3D avatar-powered virtual interview system that replaces the previous 2D implementation. This feature provides realistic AI-driven interviews with Ready Player Me avatars and advanced speech recognition.

## Key Features

### 3D Avatar System
- **Ready Player Me Integration**: Photorealistic 3D avatars using GLB models
- **Gesture States**: Realistic animations including idle, talking, and listening
- **Three.js Rendering**: High-performance 3D rendering using React Three Fiber

### AI-Powered Interviews
- **Gemini Integration**: Advanced AI using Google's Gemini API for natural conversations
- **Dynamic Questions**: Context-aware interview questions based on job roles
- **Real-time Scoring**: Live performance evaluation and feedback

### Advanced Input/Output
- **Speech Recognition**: Real-time voice input using Web Speech API
- **Text-to-Speech**: Natural voice responses with customizable voices
- **Webcam Integration**: Optional video recording and facial expression analysis

### Job Role Support
- Software Engineer
- Product Manager
- Data Scientist
- UX/UI Designer
- Marketing Specialist
- Sales Representative

## Technical Architecture

### Components
- `Avatar.tsx` - 3D avatar component with animations
- `Scene.tsx` - Three.js scene setup and lighting
- `VirtualInterview.tsx` - Main interface and state management

### Services
- `aiService.ts` - Gemini API integration and conversation management
- `speechRecognition.ts` - Voice input processing
- `textToSpeech.ts` - Voice output generation
- `webcam.ts` - Camera integration and video processing

### Hooks
- `useSpeechRecognition` - Speech input management
- `useTextToSpeech` - Voice output control
- `useWebcam` - Camera access and controls

### Types
- `avatar.ts` - TypeScript definitions for avatar states and interactions

## Usage

### For Applicants
1. Navigate to the Virtual Interview section from the dashboard
2. Select your target job role
3. Start the interview and interact naturally with the AI interviewer
4. Receive real-time feedback and scoring
5. Review performance metrics after completion

### Environment Setup
Ensure the following environment variable is configured:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Files Added/Modified

### New Files
- `src/types/avatar.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useTextToSpeech.ts` 
- `src/hooks/useWebcam.ts`
- `src/services/aiService.ts`
- `src/components/applicant/Avatar.tsx`
- `src/components/applicant/Scene.tsx`
- `public/avatar.glb`

### Modified Files
- `src/pages/applicant/VirtualInterview.tsx` - Complete rewrite with 3D avatar
- `src/App.tsx` - Updated routing (minimal change)
- `.env` - Added Gemini API key

### Backup Files
- `src/pages/applicant/VirtualInterviewOld.tsx` - Original implementation backup

## Dependencies Added
- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `@react-three/postprocessing` - Post-processing effects
- `@types/three` - TypeScript definitions

## Browser Compatibility
- Chrome/Edge: Full support (recommended)
- Firefox: Full support
- Safari: Limited Speech Recognition support
- Mobile browsers: Basic functionality

## Performance Considerations
- The 3D avatar is optimized for web delivery (~2MB GLB file)
- Speech recognition runs locally in the browser
- AI processing happens server-side via Gemini API
- Webcam access is optional and can be disabled for better performance

## Future Enhancements
- Multi-language support
- Custom avatar selection
- Interview recording and playback
- Advanced analytics and insights
- Integration with recruitment workflows
