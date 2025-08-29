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
    
    try {
      socket.value = new WebSocket(url)
      
      socket.value.onopen = () => {
        isConnected.value = true
        connectionStatus.value = 'connected'
        reconnectAttempts.value = 0
        console.log('WebSocket connected to:', url)
        
        // Add a welcome message
        const welcomeMessage: WebSocketMessage = {
          type: 'system',
          data: { message: `Connected to Top Trumps server at ${url}` },
          timestamp: Date.now()
        }
        lastMessage.value = welcomeMessage
        messageHistory.value.push(welcomeMessage)
      }
      
      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const wsMessage: WebSocketMessage = {
            type: message.type || 'unknown',
            data: message.data || message,
            timestamp: Date.now()
          }
          lastMessage.value = wsMessage
          messageHistory.value.push(wsMessage)
          handleIncomingMessage(wsMessage)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      socket.value.onclose = (event) => {
        isConnected.value = false
        connectionStatus.value = 'disconnected'
        console.log('WebSocket disconnected:', event.code, event.reason)
        
        // Add disconnect message
        const disconnectMessage: WebSocketMessage = {
          type: 'system',
          data: { message: 'Disconnected from server' },
          timestamp: Date.now()
        }
        messageHistory.value.push(disconnectMessage)
      }
      
      socket.value.onerror = (error) => {
        connectionStatus.value = 'error'
        console.error('WebSocket error:', error)
        
        // Add error message
        const errorMessage: WebSocketMessage = {
          type: 'system',
          data: { message: 'Connection error occurred' },
          timestamp: Date.now()
        }
        messageHistory.value.push(errorMessage)
      }
      
    } catch (error) {
      connectionStatus.value = 'error'
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
    }
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    console.log('WebSocket disconnected')
  }

  function sendMessage(message: any) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      try {
        socket.value.send(JSON.stringify(message))
        
        // Add sent message to history
        const sentMessage: WebSocketMessage = {
          type: 'sent',
          data: message,
          timestamp: Date.now()
        }
        messageHistory.value.push(sentMessage)
        
        return true
      } catch (error) {
        console.error('Failed to send message:', error)
        return false
      }
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
