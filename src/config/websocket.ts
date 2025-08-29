export const WEBSOCKET_CONFIG = {
  // Default WebSocket server URL - change this to match your server
  DEFAULT_URL: 'ws://13.223.180.228:8080/ws',
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  
  // Message settings
  MAX_MESSAGE_HISTORY: 100,
  
  // Heartbeat settings (for keeping connection alive)
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  HEARTBEAT_MESSAGE: { type: 'ping', data: { timestamp: Date.now() } }
}
