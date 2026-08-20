# AI Health Voice Screening Agent

A web application where users can have live voice conversations with an AI health screening assistant. The AI asks adaptive health-intake questions, remembers previous answers, and generates a structured health-screening report when the call ends.

## Features

- **Real-time Voice Conversation**: Turn-based voice interaction using WebSockets
- **Adaptive AI Agent**: Asks targeted health questions based on conversation context
- **Multilingual Support**: Supports English and Hindi with automatic language detection
- **Structured Health Reports**: Generates doctor-friendly summaries from conversations
- **Graceful Fallbacks**: Browser-based STT/TTS fallbacks when cloud APIs are unavailable
- **Error Resilience**: Comprehensive error handling for API failures, silence, and disconnects

## Architecture

```
┌─────────────┐     WebSocket     ┌──────────────┐
│   React     │ ◄──────────────► │   Express     │
│   Frontend  │                   │   Backend    │
└─────────────┘                   └──────────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                              ▼             ▼             ▼
                        ┌──────────┐  ┌──────────┐  ┌──────────┐
                        │   STT    │  │   LLM    │  │   TTS    │
                        │ Provider │  │ Provider │  │ Provider │
                        └──────────┘  └──────────┘  └──────────┘
```

### Tech Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Web Audio API / MediaRecorder
- WebSocket client

**Backend:**
- Node.js with TypeScript
- Express.js
- WebSocket (ws)
- Provider abstraction for AI services

**AI Providers:**
- Primary: Sarvam AI (STT, LLM, TTS)
- Fallback: Browser SpeechRecognition (STT), Browser SpeechSynthesis (TTS)

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Sarvam AI API Key (optional - fallbacks available)
SARVAM_API_KEY=

# Provider Selection
STT_PROVIDER=sarvam
LLM_PROVIDER=sarvam
TTS_PROVIDER=sarvam
```

## Local Setup

### Prerequisites

- Node.js v18.x or v20.x LTS
- npm v9+

### Installation

1. Clone the repository
2. Install all dependencies:

```bash
npm run install:all
```

### Running the Application

**Development mode (both frontend and backend):**
```bash
npm run dev
```

**Frontend only:**
```bash
cd client
npm run dev
```

**Backend only:**
```bash
cd server
npm run dev
```

### Building for Production

```bash
npm run build
```

## Deployment Instructions

### Backend Deployment

1. Set environment variables on your hosting platform
2. Build the backend: `cd server && npm run build`
3. Start the server: `npm start`
4. Ensure `CLIENT_URL` is set to your production frontend URL

### Frontend Deployment

1. Build the frontend: `cd client && npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Update `VITE_WS_URL` to point to your production WebSocket endpoint

## WebSocket Architecture

The application uses a turn-based WebSocket protocol:

**Client → Server Events:**
- `start_call`: Initiates a new screening session
- `audio_start`: Signals beginning of user speech
- `audio_chunk`: Sends audio data chunks
- `audio_end`: Signals end of user speech
- `end_call`: Terminates the session and generates report

**Server → Client Events:**
- `call_started`: Session initialized
- `processing`: AI is processing input
- `transcript`: User's speech transcribed
- `assistant_text`: AI's text response
- `assistant_audio`: AI's audio response (base64)
- `report`: Structured health report
- `error`: Error messages

## Conversation State Management

The conversation engine maintains:

- **Health State**: Structured collection of patient information (name, concern, symptoms, duration, severity, etc.)
- **Conversation History**: Full transcript of user/assistant exchanges
- **Language Detection**: Tracks user's language (en/hi/hinglish)
- **Screening Progress**: Tracks which fields have been collected

State is stored in-memory per session using a Map. This architecture allows easy migration to Redis/PostgreSQL for production.

## Failure Handling

The application handles:

- **STT Failure**: Falls back to browser SpeechRecognition or asks user to repeat
- **Empty Transcript**: Prompts user to try again
- **LLM Failure**: Recovers with safe fallback response, maintains conversation state
- **TTS Failure**: Displays text and uses browser SpeechSynthesis
- **WebSocket Disconnect**: Shows connection lost, provides reconnect option
- **Incomplete Calls**: Generates partial report with "Not collected" fields

## Medical Safety Considerations

**This AI screening is for informational purposes only and is not a medical diagnosis or a substitute for professional medical care.**

The AI:
- ✅ Collects symptoms and asks screening questions
- ✅ Summarizes information for healthcare providers
- ✅ Identifies when professional medical attention may be appropriate
- ❌ NEVER diagnoses diseases
- ❌ NEVER prescribes medication
- ❌ NEVER claims certainty about medical conditions

## Design Decisions

### Turn-Based vs Full-Duplex

This implementation uses turn-based interaction (user speaks → process → AI responds) rather than full-duplex real-time streaming. This decision prioritizes:
- Reliability over low latency
- Clear conversation state management
- Graceful error handling
- Easier debugging and testing

### Provider Abstraction

All AI services (STT, LLM, TTS) use interface-based abstractions, enabling:
- Easy provider switching
- Graceful fallbacks
- Testing with mock providers
- Future provider additions

### In-Memory Session Store

Sessions are stored in-memory for this assessment. Production improvements would include:
- Redis for distributed session storage
- PostgreSQL for persistent conversation history
- Session cleanup and TTL management

## Known Limitations

- Turn-based interaction (not full-duplex streaming)
- In-memory session storage (lost on server restart)
- No authentication/authorization
- No rate limiting
- Browser SpeechRecognition not supported in all browsers
- Sarvam AI APIs may have rate limits

## Production Improvements

With more time, I would add:

- **Infrastructure**: Redis session store, PostgreSQL database, authentication
- **Observability**: Structured logging, metrics, error tracking (Sentry)
- **Audio**: Streaming STT/TTS, interruption/barge-in support, better codec handling
- **Safety**: Enhanced medical safety validation, red flag detection
- **Testing**: E2E tests with Playwright, increased unit test coverage
- **Performance**: Response caching, connection pooling, CDN for audio
- **Security**: API key rotation, encrypted storage, input sanitization

## Why This Architecture?

The assessment explicitly accepts turn-based voice interaction, so I prioritized:
1. **Reliability**: Turn-based is more stable than attempting full-duplex
2. **State Management**: Clear turn boundaries make conversation state easier to track
3. **Error Handling**: Isolated turns allow graceful recovery from failures
4. **Maintainability**: Simpler architecture is easier to understand and extend

## Testing

Run tests:

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

Tests cover:
- Conversation state initialization and updates
- Adaptive question generation
- Empty transcript handling
- Incomplete/complete report generation
- LLM malformed response handling

## License

MIT
