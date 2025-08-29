# 🎴 Top Trumps Frontend

A modern Vue.js frontend for the Top Trumps card game with real-time WebSocket connectivity.

## Features

- 🚀 **Vue 3** with Composition API and TypeScript
- 🔌 **WebSocket Integration** for real-time game communication
- 🎨 **Modern UI** built with Tailwind CSS
- 📱 **Responsive Design** that works on all devices
- 🔄 **Auto-reconnection** with configurable retry logic
- 📊 **Connection Status** monitoring and message history
- 🎮 **Game Ready** interface for Top Trumps gameplay

## Prerequisites

- Node.js 20.19.0 or higher (or 22.12.0+)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd top_trumps_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure WebSocket server URL:
   - Edit `src/config/websocket.ts`
   - Update `DEFAULT_URL` to match your WebSocket server

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## WebSocket Configuration

The application automatically connects to the WebSocket server on startup. You can configure the connection in `src/config/websocket.ts`:

```typescript
export const WEBSOCKET_CONFIG = {
  DEFAULT_URL: 'ws://localhost:8080', // Change this to your server
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  MAX_MESSAGE_HISTORY: 100,
  HEARTBEAT_INTERVAL: 30000
}
```

## Game Flow

The game follows a simple connection-based flow:

1. **Connect**: Click the "Connect" button on the home page
2. **Navigate**: Once connected, click "🎮 Play Top Trumps" to go to the game
3. **Play**: Enjoy a full Top Trumps game with AI opponent
4. **Return**: Use "Back to Home" button to return to the main page

### Game Features:
- **Full Top Trumps Gameplay**: Select cards, choose attributes, compare values
- **AI Opponent**: Play against a computer opponent for demo purposes
- **Score Tracking**: Keep track of rounds won and lost
- **Game History**: View all moves and results
- **Responsive Design**: Works perfectly on all devices

## Game Features

- **Connection Management**: Connect/disconnect to WebSocket server (simulated)
- **Status Monitoring**: Real-time connection status with visual indicators
- **Message Testing**: Send test messages to verify server communication
- **Message History**: View all received messages with timestamps
- **Full Game Interface**: Complete Top Trumps game with AI opponent
- **Card Selection**: Choose from 5 unique character cards
- **Attribute Comparison**: Compare Attack, Defense, Speed, and Magic values
- **Score Tracking**: Monitor rounds won and lost
- **Game History**: View complete game progression
- **Responsive Design**: Works perfectly on all devices

## Project Structure

```
src/
├── assets/          # CSS and static assets
├── components/      # Vue components
├── config/          # Configuration files
├── router/          # Vue Router configuration
├── stores/          # Pinia stores (WebSocket, game state)
├── views/           # Page components
└── main.ts          # Application entry point
```

## Technologies Used

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

## Next Steps

To complete the Top Trumps game, you'll need to:

1. Implement the game logic in the WebSocket store
2. Create game components (cards, game board, etc.)
3. Handle game state management
4. Implement player turns and game flow
5. Add card comparison logic

## License

This project is licensed under the MIT License.
