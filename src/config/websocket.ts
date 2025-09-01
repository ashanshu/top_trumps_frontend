export const WEBSOCKET_CONFIG = {
  // WebSocket server URLs - you can use either one
  LOCAL_URL: 'ws://localhost:8080/ws',                    // For local development (localhost)
  LOCAL_IP_URL: 'ws://10.8.183.4:8080/ws',               // For local development (specific IP)
  PRODUCTION_URL: 'ws://13.223.180.228:8080/ws',            // For production/remote server
  
  // Default URL - change this based on your environment
  DEFAULT_URL: 'ws://13.223.180.228:8080',               // Currently using production server
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  
  // Message settings
  MAX_MESSAGE_HISTORY: 100,
  
  // Heartbeat settings (for keeping connection alive)
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  HEARTBEAT_MESSAGE: { type: 'ping', data: { timestamp: Date.now() } }
}
