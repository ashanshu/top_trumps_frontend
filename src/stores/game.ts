import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export interface Card {
  id: string
  name: string
  attributes: Record<string, number>
  image?: string
}

export interface Player {
  id: string
  name: string
  cards: Card[]
  isCurrentTurn: boolean
}

export interface GameState {
  id: string
  status: 'waiting' | 'matched' | 'playing' | 'finished'
  players: Player[]
  currentPlayerIndex: number
  deck: Card[]
  round: number
  winner?: Player
  matchmakingId?: string
}

export interface MatchmakingRequest {
  playerId: string
  playerName: string
  timestamp: number
}

export const useGameStore = defineStore('game', () => {
  const websocketStore = useWebSocketStore()
  
  // Listen for WebSocket messages
  const handleWebSocketMessage = (event: CustomEvent) => {
    const message = event.detail
    const { type, data } = message.data
    
    switch (type) {
      case 'match_found':
        handleMatchFound(data.gameState)
        break
      case 'game_update':
        updateGameState(data.gameState)
        break
      case 'player_joined':
        console.log('Player joined:', data.playerName)
        break
      case 'game_started':
        if (currentGame.value) {
          currentGame.value.status = 'playing'
        }
        break
      default:
        console.log('Unhandled message type:', type, data)
    }
  }
  
  // Game state
  const currentGame = ref<GameState | null>(null)
  const selectedCard = ref<Card | null>(null)
  const selectedAttribute = ref<string | null>(null)
  const gameHistory = ref<GameState[]>([])
  
  // Matchmaking state
  const isInMatchmaking = ref(false)
  const matchmakingStatus = ref<'idle' | 'searching' | 'found' | 'error'>('idle')
  const playerInfo = ref<{ id: string; name: string } | null>(null)
  
  // Computed properties
  const isGameActive = computed(() => currentGame.value?.status === 'playing')
  const isWaitingForPlayers = computed(() => currentGame.value?.status === 'waiting')
  const isMatched = computed(() => currentGame.value?.status === 'matched')
  const currentPlayer = computed(() => {
    if (!currentGame.value) return null
    return currentGame.value.players[currentGame.value.currentPlayerIndex]
  })
  
  // Game actions
  function startMatchmaking(playerName: string) {
    if (!websocketStore.isConnected) {
      throw new Error('Not connected to server')
    }
    
    // Generate unique player ID
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    playerInfo.value = { id: playerId, name: playerName }
    isInMatchmaking.value = true
    matchmakingStatus.value = 'searching'
    
    // Send matchmaking request to server
    websocketStore.sendMessage({
      type: 'find_match',
      data: { 
        playerId, 
        playerName,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    })
    
    console.log('Started matchmaking for player:', playerName, 'ID:', playerId)
  }
  
  function cancelMatchmaking() {
    if (!websocketStore.isConnected || !playerInfo.value) return
    
    websocketStore.sendMessage({
      type: 'cancel_match',
      data: { 
        playerId: playerInfo.value.id,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    })
    
    isInMatchmaking.value = false
    matchmakingStatus.value = 'idle'
    console.log('Cancelled matchmaking')
  }
  
  function createGame() {
    const gameId = `game_${Date.now()}`
    const newGame: GameState = {
      id: gameId,
      status: 'waiting',
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      round: 1
    }
    
    currentGame.value = newGame
    gameHistory.value.push(newGame)
    
    // Send create game message to server
    websocketStore.sendMessage({
      type: 'create_game',
      data: { gameId },
      timestamp: Date.now()
    })
    
    return newGame
  }
  
  function joinGame(gameId: string, playerName: string) {
    if (!websocketStore.isConnected) {
      throw new Error('Not connected to server')
    }
    
    websocketStore.sendMessage({
      type: 'join_game',
      data: { gameId, playerName },
      timestamp: Date.now()
    })
  }
  
  function startGame() {
    if (!currentGame.value || !websocketStore.isConnected) return
    
    websocketStore.sendMessage({
      type: 'start_game',
      data: { gameId: currentGame.value.id },
      timestamp: Date.now()
    })
  }
  
  function selectCard(card: Card) {
    selectedCard.value = card
  }
  
  function selectAttribute(attribute: string) {
    selectedAttribute.value = attribute
  }
  
  function playCard() {
    if (!selectedCard.value || !selectedAttribute.value || !currentGame.value) return
    
    websocketStore.sendMessage({
      type: 'play_card',
      data: {
        gameId: currentGame.value.id,
        cardId: selectedCard.value.id,
        attribute: selectedAttribute.value
      },
      timestamp: Date.now()
    })
    
    // Reset selections
    selectedCard.value = null
    selectedAttribute.value = null
  }
  
  function updateGameState(gameState: GameState) {
    currentGame.value = gameState
    
    // Update game history
    const existingIndex = gameHistory.value.findIndex(g => g.id === gameState.id)
    if (existingIndex >= 0) {
      gameHistory.value[existingIndex] = gameState
    } else {
      gameHistory.value.push(gameState)
    }
  }
  
  function handleMatchFound(gameState: GameState) {
    // Match found! Update game state
    currentGame.value = gameState
    isInMatchmaking.value = false
    matchmakingStatus.value = 'found'
    
    // Initialize the game deck
    initializeSampleDeck()
    
    console.log('Match found! Game started with:', gameState.players.map(p => p.name))
    
    // Auto-start the game after a short delay
    setTimeout(() => {
      if (currentGame.value) {
        currentGame.value.status = 'playing'
        matchmakingStatus.value = 'idle'
      }
    }, 2000)
  }
  
  function resetGame() {
    currentGame.value = null
    selectedCard.value = null
    selectedAttribute.value = null
  }
  
  // Initialize with sample cards for testing
  const sampleCards: Card[] = [
    {
      id: 'card_1',
      name: 'Dragon',
      attributes: {
        'Attack': 85,
        'Defense': 70,
        'Speed': 60,
        'Magic': 90
      }
    },
    {
      id: 'card_2',
      name: 'Knight',
      attributes: {
        'Attack': 75,
        'Defense': 85,
        'Speed': 70,
        'Magic': 40
      }
    },
    {
      id: 'card_3',
      name: 'Wizard',
      attributes: {
        'Attack': 50,
        'Defense': 40,
        'Speed': 60,
        'Magic': 95
      }
    }
  ]
  
  function initializeSampleDeck() {
    if (currentGame.value) {
      currentGame.value.deck = [...sampleCards]
    }
  }
  
  // Setup event listeners
  function setupEventListeners() {
    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener)
  }
  
  function cleanupEventListeners() {
    window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener)
  }
  
  // Initialize event listeners when store is created
  setupEventListeners()
  
  return {
    // State
    currentGame,
    selectedCard,
    selectedAttribute,
    gameHistory,
    isInMatchmaking,
    matchmakingStatus,
    playerInfo,
    
    // Computed
    isGameActive,
    isWaitingForPlayers,
    isMatched,
    currentPlayer,
    
    // Actions
    startMatchmaking,
    cancelMatchmaking,
    createGame,
    joinGame,
    startGame,
    selectCard,
    selectAttribute,
    playCard,
    updateGameState,
    handleMatchFound,
    resetGame,
    initializeSampleDeck,
    cleanupEventListeners
  }
})
