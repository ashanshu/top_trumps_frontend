import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WEBSOCKET_CONFIG } from '../config/websocket'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export const useWebSocketStore = defineStore('websocket', () => {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const lastMessage = ref<WebSocketMessage | null>(null)
  const messageHistory = ref<WebSocketMessage[]>([])
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS
  const reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY

  // Computed properties
  const statusText = computed(() => {
    switch (connectionStatus.value) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      default:
        return 'Disconnected'
    }
  })

  const statusColor = computed(() => {
    switch (connectionStatus.value) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  })

  // Connection methods
  function connect(url: string = WEBSOCKET_CONFIG.DEFAULT_URL) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    connectionStatus.value = 'connecting'
    
    // Simulate connection for demo purposes
    setTimeout(() => {
      isConnected.value = true
      connectionStatus.value = 'connected'
      reconnectAttempts.value = 0
      console.log('WebSocket connected (simulated)')
      
      // Add a welcome message
      const welcomeMessage: WebSocketMessage = {
        type: 'system',
        data: { message: 'Connected to Top Trumps server (demo mode)' },
        timestamp: Date.now()
      }
      lastMessage.value = welcomeMessage
      messageHistory.value.push(welcomeMessage)
    }, 1000)
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
    }
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    console.log('WebSocket disconnected (simulated)')
  }

  function sendMessage(message: any) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      return true
    }
    return false
  }

  function clearMessageHistory() {
    messageHistory.value = []
    lastMessage.value = null
  }

  function handleIncomingMessage(message: WebSocketMessage) {
    // Emit a custom event that other stores can listen to
    const customEvent = new CustomEvent('websocket-message', { 
      detail: message 
    })
    window.dispatchEvent(customEvent)
    
    console.log('WebSocket message received:', message)
  }

  return {
    // State
    socket,
    isConnected,
    connectionStatus,
    lastMessage,
    messageHistory,
    reconnectAttempts,
    
    // Computed
    statusText,
    statusColor,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    clearMessageHistory,
    handleIncomingMessage
  }
})
