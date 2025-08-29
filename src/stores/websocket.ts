import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WEBSOCKET_CONFIG } from '../config/websocket'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface GameMessage {
  action: string
  room?: string
  player?: string
  card?: any
  attribute?: string
  deck?: any[]
  round?: number
  p1Card?: any
  p2Card?: any
  attr?: string
  winner?: string
  p1Deck?: number
  p2Deck?: number
  gameOver?: string
  
  // New server message format
  opponentDeckSize?: number
  opponentTopCard?: {
    Name: string
    Stats: Record<string, number>
    Image: string
  }
  yourDeckSize?: number
  yourTopCard?: {
    Name: string
    Stats: Record<string, number>
    Image: string
  }
  yourTurn?: boolean
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
  
  // Game state
  const currentRoom = ref<string>('')
  const playerName = ref<string>('')
  const isInGame = ref(false)
  const isWaitingForOpponent = ref(false)
  const playerDeck = ref<any[]>([])
  const opponentDeck = ref<any[]>([])
  const playerDeckSize = ref<number>(0)
  const opponentDeckSize = ref<number>(0)
  const currentRound = ref<number>(0)
  const gameResult = ref<any>(null)

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
          console.log('Raw message received:', message)
          
          const wsMessage: WebSocketMessage = {
            type: message.type || 'game', // Default to 'game' if no type
            data: message.data || message,
            timestamp: Date.now()
          }
          console.log('Created wsMessage:', wsMessage)
          console.log('wsMessage.data:', wsMessage.data)
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
        console.log('Sending WebSocket message:', message)
        socket.value.send(JSON.stringify(message))
        
        // Add sent message to history
        const sentMessage: WebSocketMessage = {
          type: 'sent',
          data: message,
          timestamp: Date.now()
        }
        messageHistory.value.push(sentMessage)
        
        console.log('Message sent successfully')
        return true
      } catch (error) {
        console.error('Failed to send message:', error)
        return false
      }
    } else {
      console.error('WebSocket not open. State:', socket.value?.readyState)
      return false
    }
  }

  function clearMessageHistory() {
    messageHistory.value = []
    lastMessage.value = null
  }

  function joinRoom(room: string, player: string) {
    console.log('joinRoom called with:', { room, player })
    console.log('WebSocket state:', socket.value?.readyState)
    
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return false
    }

    currentRoom.value = room
    playerName.value = player
    isWaitingForOpponent.value = true
    
    const message: GameMessage = {
      action: 'join',
      room: room,
      player: player
    }
    
    console.log('Sending join message:', message)
    const result = sendMessage(message)
    console.log('Join message send result:', result)
    return result
  }

  function playCard(cardName: string, attribute: string) {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return false
    }

    const message: GameMessage = {
      action: 'playCard',
      card: { name: cardName },
      attribute: attribute
    }
    
    return sendMessage(message)
  }

  function handleIncomingMessage(message: WebSocketMessage) {
    // Handle game-specific messages
    if (message.type === 'game' && message.data) {
      const gameData = message.data as GameMessage
      
      switch (gameData.action) {
        case 'start':
          console.log('START action received with gameData:', gameData)
          console.log('yourDeckSize:', gameData.yourDeckSize, 'opponentDeckSize:', gameData.opponentDeckSize)
          isInGame.value = true
          isWaitingForOpponent.value = false
          
          // Handle new server message format
          if (gameData.yourTopCard) {
            // Convert server format to our local format
            const playerCard = {
              id: `server_${Date.now()}`,
              name: gameData.yourTopCard.Name,
              image: gameData.yourTopCard.Image,
              attributes: gameData.yourTopCard.Stats
            }
            
            // Create a deck with the specified size, showing the top card
            const deckSize = gameData.yourDeckSize || 1
            console.log('Setting playerDeckSize to:', deckSize, 'from gameData.yourDeckSize:', gameData.yourDeckSize)
            playerDeckSize.value = deckSize
            playerDeck.value = Array(deckSize).fill(null).map((_, index) => {
              if (index === 0) {
                // First card is the revealed top card
                return playerCard
              } else {
                // Other cards are hidden/placeholder cards
                return {
                  id: `hidden_${index}`,
                  name: `Card ${index + 1}`,
                  image: '❓',
                  attributes: {},
                  isHidden: true
                }
              }
            })
            
            // Store opponent info - create placeholder deck
            const opponentSize = gameData.opponentDeckSize || 0
            console.log('Setting opponentDeckSize to:', opponentSize, 'from gameData.opponentDeckSize:', gameData.opponentDeckSize)
            opponentDeckSize.value = opponentSize
            opponentDeck.value = Array(opponentSize).fill(null).map((_, index) => ({
              id: `opponent_hidden_${index}`,
              name: `Opponent Card ${index + 1}`,
              image: '❓',
              attributes: {},
              isHidden: true
            }))
            
            console.log('Game started with server deck:', {
              playerCard,
              deckSize: gameData.yourDeckSize,
              opponentDeckSize: gameData.opponentDeckSize,
              yourTurn: gameData.yourTurn
            })
            console.log('After setting - playerDeckSize.value:', playerDeckSize.value, 'opponentDeckSize.value:', opponentDeckSize.value)
          } else if (gameData.deck) {
            // Fallback to old format
            playerDeck.value = gameData.deck || []
            console.log('Game started with deck:', gameData.deck)
          }
          break
          
        case 'roundResult':
          console.log('Round result received:', gameData)
          
          // Update player deck with new top card and size
          if (gameData.yourTopCard && typeof gameData.yourDeckSize === 'number') {
            playerDeckSize.value = gameData.yourDeckSize
            
            const newTopCard = {
              id: `server_${Date.now()}`,
              name: gameData.yourTopCard.Name,
              image: gameData.yourTopCard.Image,
              attributes: gameData.yourTopCard.Stats,
              isHidden: false
            }
            
            // Create new player deck with the new top card and remaining hidden cards
            const newPlayerDeck = [newTopCard]
            for (let i = 1; i < gameData.yourDeckSize; i++) {
              newPlayerDeck.push({
                id: `hidden_${i}`,
                name: `Card ${i + 1}`,
                image: '❓',
                attributes: {},
                isHidden: true
              })
            }
            playerDeck.value = newPlayerDeck
          }
          
          // Update opponent deck with new top card and size
          if (gameData.opponentTopCard && typeof gameData.opponentDeckSize === 'number') {
            opponentDeckSize.value = gameData.opponentDeckSize
            
            const newOpponentTopCard = {
              id: `server_${Date.now()}_opponent`,
              name: gameData.opponentTopCard.Name,
              image: gameData.opponentTopCard.Image,
              attributes: gameData.opponentTopCard.Stats,
              isHidden: false
            }
            
            // Create new opponent deck with the new top card and remaining hidden cards
            const newOpponentDeck = [newOpponentTopCard]
            for (let i = 1; i < gameData.opponentDeckSize; i++) {
              newOpponentDeck.push({
                id: `hidden_opponent_${i}`,
                name: `Card ${i + 1}`,
                image: '❓',
                attributes: {},
                isHidden: true
              })
            }
            opponentDeck.value = newOpponentDeck
          }
          
          // Update game state
          currentRound.value = (currentRound.value || 0) + 1
          isWaitingForOpponent.value = false
          
          // Store round result for display
          gameResult.value = {
            winner: gameData.winner,
            round: currentRound.value,
            gameOver: gameData.gameOver || ''
          }
          
          // Check if game is over
          if (gameData.gameOver) {
            isInGame.value = false
            console.log('Game over:', gameData.gameOver)
          }
          break
      }
    }
    
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
    
    // Game state
    currentRoom,
    playerName,
    isInGame,
    isWaitingForOpponent,
    playerDeck,
    opponentDeck,
    playerDeckSize,
    opponentDeckSize,
    currentRound,
    gameResult,
    
    // Computed
    statusText,
    statusColor,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    clearMessageHistory,
    joinRoom,
    playCard,
    handleIncomingMessage
  }
})
