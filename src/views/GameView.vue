<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWebSocketStore } from '../stores/websocket'

const router = useRouter()
const websocketStore = useWebSocketStore()

// Game state
const currentRound = ref(1)
const playerScore = ref(0)
const opponentScore = ref(0)
const gameHistory = ref<string[]>([])
const isGameOver = ref(false)
const gameStarted = ref(false)

// Card selection
const selectedCard = ref<PetCard | null>(null)
const selectedAttribute = ref<string>('')
const opponentCard = ref<PetCard | null>(null)
const roundResult = ref<string | null>(null)
const isPlayerTurn = ref(true)
const isRoundComplete = ref(false)

// Define card type - flexible to handle both local and server formats
interface PetCard {
  id?: string
  name?: string
  Name?: string
  image?: string
  Image?: string
  attributes?: Record<string, number>
  Stats?: Record<string, number>
  isHidden?: boolean
}

// Enhanced card deck with 20 unique pet cards
const allCards: PetCard[] = [
  {
    id: 'card_1',
    name: 'Golden Retriever',
    image: '🐕',
    attributes: { 'Speed': 65, 'Strength': 70, 'Intelligence': 80, 'Cuteness': 90 }
  },
  {
    id: 'card_2',
    name: 'Persian Cat',
    image: '🐈',
    attributes: { 'Speed': 50, 'Strength': 40, 'Intelligence': 65, 'Cuteness': 95 }
  },
  {
    id: 'card_3',
    name: 'Hamster',
    image: '🐹',
    attributes: { 'Speed': 40, 'Strength': 20, 'Intelligence': 35, 'Cuteness': 85 }
  },
  {
    id: 'card_4',
    name: 'Parrot',
    image: '🦜',
    attributes: { 'Speed': 75, 'Strength': 30, 'Intelligence': 85, 'Cuteness': 70 }
  },
  {
    id: 'card_5',
    name: 'Rabbit',
    image: '🐰',
    attributes: { 'Speed': 80, 'Strength': 35, 'Intelligence': 45, 'Cuteness': 88 }
  },
  {
    id: 'card_6',
    name: 'Siberian Husky',
    image: '🐺',
    attributes: { 'Speed': 70, 'Strength': 85, 'Intelligence': 75, 'Cuteness': 80 }
  },
  {
    id: 'card_7',
    name: 'Guinea Pig',
    image: '🐹',
    attributes: { 'Speed': 30, 'Strength': 25, 'Intelligence': 30, 'Cuteness': 82 }
  },
  {
    id: 'card_8',
    name: 'Turtle',
    image: '🐢',
    attributes: { 'Speed': 10, 'Strength': 50, 'Intelligence': 40, 'Cuteness': 65 }
  },
  {
    id: 'card_9',
    name: 'Budgie',
    image: '🦜',
    attributes: { 'Speed': 60, 'Strength': 25, 'Intelligence': 50, 'Cuteness': 75 }
  },
  {
    id: 'card_10',
    name: 'Chihuahua',
    image: '🐕',
    attributes: { 'Speed': 55, 'Strength': 20, 'Intelligence': 60, 'Cuteness': 90 }
  },
  {
    id: 'card_11',
    name: 'Maine Coon Cat',
    image: '🐈',
    attributes: { 'Speed': 55, 'Strength': 65, 'Intelligence': 70, 'Cuteness': 85 }
  },
  {
    id: 'card_12',
    name: 'Bearded Dragon',
    image: '🦎',
    attributes: { 'Speed': 20, 'Strength': 40, 'Intelligence': 35, 'Cuteness': 60 }
  },
  {
    id: 'card_13',
    name: 'Ferret',
    image: '🦦',
    attributes: { 'Speed': 85, 'Strength': 45, 'Intelligence': 65, 'Cuteness': 78 }
  },
  {
    id: 'card_14',
    name: 'Pug',
    image: '🐕',
    attributes: { 'Speed': 40, 'Strength': 30, 'Intelligence': 55, 'Cuteness': 95 }
  },
  {
    id: 'card_15',
    name: 'Border Collie',
    image: '🐕',
    attributes: { 'Speed': 75, 'Strength': 65, 'Intelligence': 95, 'Cuteness': 85 }
  },
  {
    id: 'card_16',
    name: 'Cockatiel',
    image: '🦜',
    attributes: { 'Speed': 65, 'Strength': 25, 'Intelligence': 55, 'Cuteness': 80 }
  },
  {
    id: 'card_17',
    name: 'Hedgehog',
    image: '🦔',
    attributes: { 'Speed': 25, 'Strength': 40, 'Intelligence': 35, 'Cuteness': 88 }
  },
  {
    id: 'card_18',
    name: 'Dachshund',
    image: '🐕',
    attributes: { 'Speed': 50, 'Strength': 35, 'Intelligence': 60, 'Cuteness': 92 }
  },
  {
    id: 'card_19',
    name: 'Ragdoll Cat',
    image: '🐈',
    attributes: { 'Speed': 45, 'Strength': 40, 'Intelligence': 65, 'Cuteness': 98 }
  },
  {
    id: 'card_20',
    name: 'Great Dane',
    image: '🐕',
    attributes: { 'Speed': 60, 'Strength': 90, 'Intelligence': 70, 'Cuteness': 75 }
  }
]

const playerDeck = ref<PetCard[]>([])
const opponentDeck = ref<PetCard[]>([])

// Computed properties
const canPlayCard = computed(() => selectedCard.value && selectedAttribute.value && selectedAttribute.value !== '' && isPlayerTurn.value)
const gameStatus = computed(() => {
  if (isGameOver.value) {
    if (playerDeck.value.length === 0) return '🎉 You Win! 🎉'
    if (opponentDeck.value.length === 0) return '😔 You Lose! 😔'
    return 'Game Over!'
  }
  if (!gameStarted.value) return 'Ready to Start'
  return `Round ${currentRound.value}`
})

// Multiplayer mode detection
const isMultiplayerMode = computed(() => websocketStore.isInGame && websocketStore.currentRoom)
const isWaitingForOpponent = computed(() => websocketStore.isWaitingForOpponent)
const multiplayerPlayerDeck = computed(() => websocketStore.playerDeck)
const multiplayerPlayerDeckSize = computed(() => {
  const size = websocketStore.playerDeckSize || 0
  console.log('multiplayerPlayerDeckSize computed:', size, 'from websocketStore.playerDeckSize:', websocketStore.playerDeckSize)
  return size
})
const multiplayerOpponentDeck = computed(() => {
  const size = websocketStore.opponentDeckSize || 0
  console.log('multiplayerOpponentDeck computed:', size, 'from websocketStore.opponentDeckSize:', websocketStore.opponentDeckSize)
  return size
})
const multiplayerRoundResult = computed(() => websocketStore.gameResult)

// Separate game state for multiplayer (don't interfere with AI mode)
const multiplayerGameStarted = computed(() => websocketStore.isInGame && !websocketStore.isWaitingForOpponent)
const multiplayerSelectedCard = ref<PetCard | null>(null)
const multiplayerSelectedAttribute = ref<string>('')
const multiplayerCanPlayCard = computed(() => 
  multiplayerSelectedCard.value && 
  multiplayerSelectedAttribute.value && 
  multiplayerSelectedAttribute.value !== '' && 
  websocketStore.gameResult?.yourTurn !== false
)

// Game functions
const startGame = () => {
  // Shuffle and deal 10 cards to each player
  const shuffledCards = [...allCards].sort(() => Math.random() - 0.5)
  playerDeck.value = shuffledCards.slice(0, 10)
  opponentDeck.value = shuffledCards.slice(10, 20)
  
  gameStarted.value = true
  // Randomly choose who starts the first round
  isPlayerTurn.value = Math.random() < 0.5
  currentRound.value = 1
  playerScore.value = 0
  opponentScore.value = 0
  gameHistory.value = []
  isGameOver.value = false
  isRoundComplete.value = false
  
  // Reset selections
  selectedCard.value = null
  selectedAttribute.value = ''
  opponentCard.value = null
  roundResult.value = null
  
  // If AI starts first, automatically play
  if (!isPlayerTurn.value) {
    setTimeout(() => {
      playAITurn()
    }, 1000) // 1 second delay for better UX
  }
}

const selectCard = (card: PetCard) => {
  if (!isPlayerTurn.value || isRoundComplete.value) return
  
  // Normalize card format for consistent handling
  const normalizedCard: PetCard = {
    id: card.id || `card_${Date.now()}`,
    name: card.name || card.Name || 'Unknown',
    image: card.image || card.Image || '❓',
    attributes: card.attributes || card.Stats || {}
  }
  
  selectedCard.value = normalizedCard
  selectedAttribute.value = ''
}

const selectAttribute = (attribute: string) => {
  if (!selectedCard.value || !isPlayerTurn.value || isRoundComplete.value) return
  selectedAttribute.value = attribute
}

const playAITurn = () => {
  // AI selects a random card and attribute
  const aiCardIndex = Math.floor(Math.random() * opponentDeck.value.length)
  const aiCard = opponentDeck.value[aiCardIndex]
  const aiAttribute = Object.keys(aiCard.attributes || {})[Math.floor(Math.random() * 4)]
  
  // AI selects a random player card to compare against
  const playerCardIndex = Math.floor(Math.random() * playerDeck.value.length)
  const playerCard = playerDeck.value[playerCardIndex]
  
  selectedCard.value = playerCard
  selectedAttribute.value = aiAttribute
  
  opponentCard.value = aiCard
  
  // Compare attributes
  const playerValue = playerCard.attributes?.[aiAttribute] || 0
  const aiValue = aiCard.attributes?.[aiAttribute] || 0
  
  let result: string
  let winner: 'player' | 'opponent' | 'tie'
  
  if (playerValue > aiValue) {
    result = `You win! ${playerCard.name}'s ${aiAttribute} (${playerValue}) beats ${aiCard.name}'s ${aiAttribute} (${aiValue})`
    winner = 'player'
    playerScore.value++
  } else if (playerValue < aiValue) {
    result = `AI wins! ${aiCard.name}'s ${aiAttribute} (${aiValue}) beats ${playerCard.name}'s ${aiAttribute} (${playerValue})`
    winner = 'opponent'
    opponentScore.value++
  } else {
    result = `It's a tie! Both cards have ${aiAttribute} = ${playerValue}`
    winner = 'tie'
  }
  
  roundResult.value = result
  gameHistory.value.push(`Round ${currentRound.value}: ${result}`)
  
  // Remove cards from decks
  if (winner === 'player') {
    // Player wins both cards
    const playerCardToRemoveIndex = playerDeck.value.findIndex(c => c.id === playerCard.id)
    if (playerCardToRemoveIndex > -1) {
      playerDeck.value.splice(playerCardToRemoveIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  } else if (winner === 'opponent') {
    // AI wins both cards
    const playerCardToRemoveIndex = playerDeck.value.findIndex(c => c.id === playerCard.id)
    if (playerCardToRemoveIndex > -1) {
      playerDeck.value.splice(playerCardToRemoveIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  }
  // In case of tie, both cards are removed
  else {
    const playerCardToRemoveIndex = playerDeck.value.findIndex(c => c.id === playerCard.id)
    if (playerCardToRemoveIndex > -1) {
      playerDeck.value.splice(playerCardToRemoveIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  }
  
  isRoundComplete.value = true
  
  // Check if game is over
  if (playerDeck.value.length === 0 || opponentDeck.value.length === 0) {
    isGameOver.value = true
  }
}

const playCard = () => {
  if (!canPlayCard.value || isRoundComplete.value || !selectedCard.value) return
  
  // AI selects a random card but MUST use the same attribute as the player
  const aiCardIndex = Math.floor(Math.random() * opponentDeck.value.length)
  const aiCard = opponentDeck.value[aiCardIndex]
  const aiAttribute = selectedAttribute.value // AI uses the SAME attribute as player
  
  opponentCard.value = aiCard
  
  // Compare attributes (now both using the same attribute)
  const playerValue = selectedCard.value.attributes?.[selectedAttribute.value] || 0
  const aiValue = aiCard.attributes?.[aiAttribute] || 0
  
  let result: string
  let winner: 'player' | 'opponent' | 'tie'
  
  if (playerValue > aiValue) {
    result = `You win! ${selectedCard.value.name}'s ${selectedAttribute.value} (${playerValue}) beats ${aiCard.name}'s ${aiAttribute} (${aiValue})`
    winner = 'player'
    playerScore.value++
  } else if (playerValue < aiValue) {
    result = `AI wins! ${aiCard.name}'s ${aiAttribute} (${aiValue}) beats ${selectedCard.value.name}'s ${selectedAttribute.value} (${playerValue})`
    winner = 'opponent'
    opponentScore.value++
  } else {
    result = `It's a tie! Both cards have ${selectedAttribute.value} = ${playerValue}`
    winner = 'tie'
  }
  
  roundResult.value = result
  gameHistory.value.push(`Round ${currentRound.value}: ${result}`)
  
  // Remove cards from decks
  if (winner === 'player') {
    // Player wins both cards
    const playerCardIndex = playerDeck.value.findIndex(c => c.id === selectedCard.value!.id)
    if (playerCardIndex > -1) {
      playerDeck.value.splice(playerCardIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  } else if (winner === 'opponent') {
    // AI wins both cards
    const playerCardIndex = playerDeck.value.findIndex(c => c.id === selectedCard.value!.id)
    if (playerCardIndex > -1) {
      playerDeck.value.splice(playerCardIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  }
  // In case of tie, both cards are removed
  else {
    const playerCardIndex = playerDeck.value.findIndex(c => c.id === selectedCard.value!.id)
    if (playerCardIndex > -1) {
      playerDeck.value.splice(playerCardIndex, 1)
    }
    const opponentCardToRemoveIndex = opponentDeck.value.findIndex(c => c.id === aiCard.id)
    if (opponentCardToRemoveIndex > -1) {
      opponentDeck.value.splice(opponentCardToRemoveIndex, 1)
    }
  }
  
  isRoundComplete.value = true
  
  // Check if game is over
  if (playerDeck.value.length === 0 || opponentDeck.value.length === 0) {
    isGameOver.value = true
  }
}

const nextRound = () => {
  if (!isRoundComplete.value) return
  
  currentRound.value++
  isRoundComplete.value = false
  selectedCard.value = null
  selectedAttribute.value = ''
  opponentCard.value = null
  roundResult.value = null
  // Alternate turns between rounds
  isPlayerTurn.value = !isPlayerTurn.value
  
  // If it's AI's turn, automatically play
  if (!isPlayerTurn.value) {
    setTimeout(() => {
      playAITurn()
    }, 1000) // 1 second delay for better UX
  }
}

// Multiplayer-specific functions (separate from AI mode)
const selectMultiplayerCard = (card: PetCard) => {
  if (websocketStore.gameResult?.yourTurn === false) return
  if (card.isHidden) return // Don't allow selection of hidden cards
  
  // Normalize card format for consistent handling
  const normalizedCard: PetCard = {
    id: card.id || `card_${Date.now()}`,
    name: card.name || card.Name || 'Unknown',
    image: card.image || card.Image || '❓',
    attributes: card.attributes || card.Stats || {}
  }
  
  multiplayerSelectedCard.value = normalizedCard
  multiplayerSelectedAttribute.value = ''
}

const selectMultiplayerAttribute = (attribute: string) => {
  if (!multiplayerSelectedCard.value || websocketStore.gameResult?.yourTurn === false) return
  multiplayerSelectedAttribute.value = attribute
}

const playMultiplayerCard = () => {
  if (!multiplayerCanPlayCard.value || !multiplayerSelectedCard.value) return
  
  // Get the card name (handle both formats)
  const cardName = multiplayerSelectedCard.value.name || multiplayerSelectedCard.value.Name || 'Unknown'
  
  // Send the card play to the server
  if (websocketStore.playCard(cardName, multiplayerSelectedAttribute.value)) {
    // Card sent successfully, wait for server response
    console.log('Card sent to server:', cardName, multiplayerSelectedAttribute.value)
    
    // Reset selection for next turn
    multiplayerSelectedCard.value = null
    multiplayerSelectedAttribute.value = ''
  } else {
    console.error('Failed to send card to server')
  }
}

const resetGame = () => {
  startGame()
}

const goHome = () => {
  router.push('/')
}

// Check if user is "connected" (simulated)
onMounted(() => {
  // Temporarily disable redirect to allow testing
  // if (!websocketStore.isConnected) {
  //   router.push('/')
  // }
  console.log('GameView mounted successfully')
})

// Watch for multiplayer game state changes
watch(() => websocketStore.isInGame, (newValue) => {
  if (newValue && websocketStore.playerDeck.length > 0) {
    // Game started from server, update local state
    gameStarted.value = true
    currentRound.value = 1
    playerScore.value = 0
    opponentScore.value = 0
    gameHistory.value = []
    isGameOver.value = false
    isRoundComplete.value = false
    isPlayerTurn.value = true
  }
})

watch(() => websocketStore.gameResult, (newValue) => {
  if (newValue && newValue.winner) {
    // Handle round result from server (new format)
    isRoundComplete.value = true
    
    if (newValue.gameOver) {
      isGameOver.value = true
      // Game over logic is now handled in the WebSocket store
    }
  }
})
</script>

<template>
  <main class="min-h-screen w-full bg-gradient-to-br from-green-50 to-blue-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">🐾 Top Trumps - Pet Battle</h1>
        <p class="text-gray-600">{{ gameStatus }}</p>
        
        <!-- Multiplayer Mode Indicator -->
        <div v-if="isMultiplayerMode" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center justify-center space-x-2">
            <span class="text-blue-600">🌐</span>
            <span class="text-blue-800 font-medium">Multiplayer Mode</span>
            <span class="text-blue-600">🌐</span>
          </div>
          <p class="text-sm text-blue-600 mt-1">Room: {{ websocketStore.currentRoom }} | Player: {{ websocketStore.playerName }}</p>
        </div>
        
        <!-- Waiting for Opponent Message -->
        <div v-if="isWaitingForOpponent" class="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="flex items-center justify-center space-x-2">
            <span class="text-yellow-600 text-2xl">⏳</span>
            <span class="text-yellow-800 font-medium">Waiting for opponent to join...</span>
          </div>
          <p class="text-sm text-yellow-600 mt-1">Please wait while we find you a match!</p>
        </div>
      </div>

      <!-- Game Controls -->
      <div class="text-center mb-6">
        <!-- AI Mode Controls -->
        <div v-if="!isMultiplayerMode">
          <button
            v-if="!gameStarted"
            @click="startGame"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            🚀 Start Game
          </button>
          <button
            v-if="gameStarted && !isGameOver"
            @click="resetGame"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors ml-3"
          >
            🔄 Reset Game
          </button>
        </div>
        
        <!-- Multiplayer Mode Controls -->
        <div v-if="isMultiplayerMode && !isWaitingForOpponent">
          <button
            v-if="!gameStarted"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed text-lg font-semibold"
            disabled
          >
            ⏳ Waiting for Server...
          </button>
        </div>
        
        <button
          @click="goHome"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-3"
        >
          🏠 Go Home
        </button>
      </div>

      <!-- Game Board -->
      <div v-if="gameStarted || multiplayerGameStarted" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Player Area -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">
            👤 {{ isMultiplayerMode ? 'Your Card' : 'Your Pets' }} 
            ({{ isMultiplayerMode ? multiplayerPlayerDeck.length : playerDeck.length }})
          </h2>
          
          <!-- Selected Card Display -->
          <div v-if="(isMultiplayerMode ? multiplayerSelectedCard : selectedCard)" class="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div class="text-center">
              <div class="text-4xl mb-2">{{ (isMultiplayerMode ? multiplayerSelectedCard : selectedCard)?.image }}</div>
              <h3 class="font-semibold text-lg">{{ (isMultiplayerMode ? multiplayerSelectedCard : selectedCard)?.name }}</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div
                  v-for="[attr, value] in Object.entries((isMultiplayerMode ? multiplayerSelectedCard : selectedCard)?.attributes || {})"
                  :key="attr"
                  @click="isMultiplayerMode ? selectMultiplayerAttribute(String(attr)) : selectAttribute(String(attr))"
                  class="p-2 rounded cursor-pointer transition-colors"
                  :class="{
                    'bg-blue-500 text-white': (isMultiplayerMode ? multiplayerSelectedAttribute : selectedAttribute) && (isMultiplayerMode ? multiplayerSelectedAttribute : selectedAttribute) === attr,
                    'bg-gray-100 hover:bg-gray-200': !(isMultiplayerMode ? multiplayerSelectedAttribute : selectedAttribute) || (isMultiplayerMode ? multiplayerSelectedCard : selectedCard)?.attributes?.[attr] === undefined
                  }"
                >
                  <div class="text-xs font-medium">{{ attr }}</div>
                  <div class="text-lg font-bold">{{ value }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Selection -->
          <div v-if="!(isMultiplayerMode ? multiplayerSelectedCard : selectedCard)" class="text-center text-gray-500 mb-4">
            <div v-if="isMultiplayerMode">
              {{ websocketStore.gameResult?.yourTurn ? 'Click your card below to select it' : 'Waiting for opponent to play...' }}
            </div>
            <div v-else>
              {{ isPlayerTurn ? 'Click a pet below to select it' : 'Waiting for AI to play...' }}
            </div>
          </div>

          <!-- Player Deck -->
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="card in (isMultiplayerMode ? multiplayerPlayerDeck : playerDeck)"
              :key="card.id || card.name"
              @click="isMultiplayerMode ? selectMultiplayerCard(card) : selectCard(card)"
              class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2"
              :class="{
                'border-blue-500 bg-blue-50': isMultiplayerMode 
                  ? (multiplayerSelectedCard?.id === card.id || multiplayerSelectedCard?.name === card.name || multiplayerSelectedCard?.name === card.Name)
                  : (selectedCard?.id === card.id || selectedCard?.name === card.name || selectedCard?.name === card.Name),
                'border-gray-200': isMultiplayerMode
                  ? (multiplayerSelectedCard?.id !== card.id && multiplayerSelectedCard?.name !== card.name && multiplayerSelectedCard?.name !== card.Name)
                  : (selectedCard?.id !== card.id && selectedCard?.name !== card.name && selectedCard?.name !== card.Name)
              }"
            >
              <div class="text-center">
                <div class="text-2xl mb-1">{{ card.image || card.Image }}</div>
                <div class="text-sm font-medium">{{ card.name || card.Name }}</div>
                <div class="text-xs text-gray-500">
                  <div v-if="!card.isHidden">
                    {{ Math.max(...Object.values((card.attributes || card.Stats) as Record<string, number>)) }} max
                  </div>
                  <div v-else class="text-gray-400">
                    Hidden
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Play Button -->
          <button
            v-if="(isMultiplayerMode ? multiplayerCanPlayCard : canPlayCard) && (isMultiplayerMode ? true : !isRoundComplete)"
            @click="isMultiplayerMode ? playMultiplayerCard() : playCard()"
            class="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
          >
            🎯 {{ isMultiplayerMode ? 'Send Card' : 'Play Pet' }}
          </button>
        </div>

        <!-- Battle Area -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">⚔️ Battle Arena</h2>
          
          <!-- Round Info -->
          <div class="text-center mb-4">
            <div class="text-2xl font-bold text-blue-600">
              {{ isMultiplayerMode ? 'Multiplayer Game' : `Round ${currentRound}` }}
            </div>
            <div class="text-sm text-gray-600">
              {{ isMultiplayerMode 
                ? `Cards: You ${multiplayerPlayerDeckSize} - Opponent ${multiplayerOpponentDeck}` 
                : `Score: You ${playerScore} - ${opponentScore} AI` 
              }}
            </div>
            <div class="text-sm font-medium mt-2" :class="isMultiplayerMode ? (websocketStore.gameResult?.yourTurn ? 'text-blue-600' : 'text-red-600') : (isPlayerTurn ? 'text-blue-600' : 'text-red-600')">
              {{ isMultiplayerMode 
                ? (websocketStore.gameResult?.yourTurn ? '🎯 Your Turn' : '⏳ Opponent Turn') 
                : (isPlayerTurn ? '🎯 Your Turn' : '🤖 AI Turn') 
              }}
            </div>
          </div>

          <!-- Battle Result -->
          <div v-if="isRoundComplete || (isMultiplayerMode && multiplayerRoundResult)" class="space-y-4">
            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 class="font-semibold text-yellow-800 mb-2">Round Result:</h3>
              <p class="text-yellow-700">
                {{ isMultiplayerMode ? 
                  (multiplayerRoundResult?.winner === websocketStore.playerName ? '🎉 You won this round!' : '😔 Opponent won this round!') : 
                  roundResult 
                }}
              </p>
            </div>

            <!-- Next Round Button -->
            <button
              v-if="!isMultiplayerMode"
              @click="nextRound"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              ➡️ Next Round
            </button>
            
            <!-- Multiplayer Status -->
            <div v-if="isMultiplayerMode" class="text-center text-sm text-gray-600">
              Waiting for next round from server...
            </div>
          </div>

          <!-- Game Over -->
          <div v-if="isGameOver" class="text-center py-8">
            <div class="text-6xl mb-4">
              {{ playerDeck.length === 0 ? '🎉' : '😔' }}
            </div>
            <p class="text-gray-600 mb-4">
              Final Score: You {{ playerScore }} - {{ opponentScore }} AI
            </p>
            <button
              @click="resetGame"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              🎮 Play Again
            </button>
          </div>
        </div>

        <!-- AI Area -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">
            {{ isMultiplayerMode ? '👥 Opponent Pets' : '🤖 AI Pets' }} 
            ({{ isMultiplayerMode ? (multiplayerOpponentDeck || 0) : opponentDeck.length }})
          </h2>
          
          <!-- AI's Played Card -->
          <div v-if="opponentCard" class="mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <div class="text-center">
              <div class="text-4xl mb-2">{{ opponentCard.image }}</div>
              <h3 class="font-semibold text-lg">{{ opponentCard.name }}</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div
                  v-for="[attr, value] in Object.entries(opponentCard.attributes || {})"
                  :key="attr"
                  class="p-2 rounded"
                  :class="{
                    'bg-red-500 text-white': selectedAttribute && selectedAttribute === attr,
                    'bg-gray-100': !selectedAttribute || selectedAttribute !== attr
                  }"
                >
                  <div class="text-xs font-medium">{{ attr }}</div>
                  <div class="text-lg font-bold">{{ value }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Deck (Hidden) -->
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="(card, index) in (isMultiplayerMode ? websocketStore.opponentDeck : opponentDeck)"
              :key="card.id"
              class="p-3 rounded-lg border-2 transition-colors"
              :class="{
                'bg-red-50 border-red-300': !card.isHidden,
                'bg-gray-100 border-gray-300': card.isHidden
              }"
            >
              <div class="text-center">
                <div class="text-2xl mb-1">
                  {{ card.isHidden ? '❓' : (card.image || '🐾') }}
                </div>
                <div class="text-sm font-medium" :class="card.isHidden ? 'text-gray-500' : 'text-gray-800'">
                  {{ card.isHidden ? 'Hidden' : card.name }}
                </div>
                <div class="text-xs text-gray-400">Pet {{ index + 1 }}</div>
                
                <!-- Show attributes if card is revealed -->
                <div v-if="!card.isHidden && card.attributes" class="mt-2 space-y-1">
                  <div
                    v-for="[attr, value] in Object.entries(card.attributes)"
                    :key="attr"
                    class="text-xs bg-white bg-opacity-50 rounded px-1"
                  >
                    {{ attr }}: {{ value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game History -->
      <div v-if="gameHistory.length > 0" class="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📜 Game History</h2>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <div
            v-for="(entry, index) in gameHistory.slice().reverse()"
            :key="index"
            class="p-2 bg-gray-50 rounded text-sm"
          >
            {{ entry }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style> 
