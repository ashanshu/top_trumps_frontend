<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

// Define card type
interface PetCard {
  id: string
  name: string
  image: string
  attributes: Record<string, number>
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
  selectedCard.value = card
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
  const aiAttribute = Object.keys(aiCard.attributes)[Math.floor(Math.random() * 4)]
  
  // AI selects a random player card to compare against
  const playerCardIndex = Math.floor(Math.random() * playerDeck.value.length)
  const playerCard = playerDeck.value[playerCardIndex]
  
  selectedCard.value = playerCard
  selectedAttribute.value = aiAttribute
  
  opponentCard.value = aiCard
  
  // Compare attributes
  const playerValue = playerCard.attributes[aiAttribute]
  const aiValue = aiCard.attributes[aiAttribute]
  
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
  const playerValue = selectedCard.value.attributes[selectedAttribute.value]
  const aiValue = aiCard.attributes[aiAttribute]
  
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
</script>

<template>
  <main class="min-h-screen w-full bg-gradient-to-br from-green-50 to-blue-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">🐾 Top Trumps - Pet Battle</h1>
        <p class="text-gray-600">{{ gameStatus }}</p>
      </div>

      <!-- Game Controls -->
      <div class="text-center mb-6">
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
        <button
          @click="goHome"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-3"
        >
          🏠 Go Home
        </button>
      </div>

      <!-- Game Board -->
      <div v-if="gameStarted" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Player Area -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">👤 Your Pets ({{ playerDeck.length }})</h2>
          
          <!-- Selected Card Display -->
          <div v-if="selectedCard" class="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div class="text-center">
              <div class="text-4xl mb-2">{{ selectedCard.image }}</div>
              <h3 class="font-semibold text-lg">{{ selectedCard.name }}</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div
                  v-for="[attr, value] in Object.entries(selectedCard.attributes)"
                  :key="attr"
                  @click="selectAttribute(attr)"
                  class="p-2 rounded cursor-pointer transition-colors"
                  :class="{
                    'bg-blue-500 text-white': selectedAttribute && selectedAttribute === attr,
                    'bg-gray-100 hover:bg-gray-200': !selectedAttribute || selectedAttribute !== attr
                  }"
                >
                  <div class="text-xs font-medium">{{ attr }}</div>
                  <div class="text-lg font-bold">{{ value }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Selection -->
          <div v-if="!selectedCard" class="text-center text-gray-500 mb-4">
            {{ isPlayerTurn ? 'Click a pet below to select it' : 'Waiting for AI to play...' }}
          </div>

          <!-- Player Deck -->
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="card in playerDeck"
              :key="card.id"
              @click="selectCard(card)"
              class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2"
              :class="{
                'border-blue-500 bg-blue-50': selectedCard?.id === card.id,
                'border-gray-200': selectedCard?.id !== card.id
              }"
            >
              <div class="text-center">
                <div class="text-2xl mb-1">{{ card.image }}</div>
                <div class="text-sm font-medium">{{ card.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ Math.max(...Object.values(card.attributes as Record<string, number>)) }} max
                </div>
              </div>
            </div>
          </div>

          <!-- Play Button -->
          <button
            v-if="canPlayCard && !isRoundComplete"
            @click="playCard"
            class="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
          >
            🎯 Play Pet
          </button>
        </div>

        <!-- Battle Area -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">⚔️ Battle Arena</h2>
          
          <!-- Round Info -->
          <div class="text-center mb-4">
            <div class="text-2xl font-bold text-blue-600">Round {{ currentRound }}</div>
            <div class="text-sm text-gray-600">Score: You {{ playerScore }} - {{ opponentScore }} AI</div>
            <div class="text-sm font-medium mt-2" :class="isPlayerTurn ? 'text-blue-600' : 'text-red-600'">
              {{ isPlayerTurn ? '🎯 Your Turn' : '🤖 AI Turn' }}
            </div>
          </div>

          <!-- Battle Result -->
          <div v-if="isRoundComplete" class="space-y-4">
            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 class="font-semibold text-yellow-800 mb-2">Round Result:</h3>
              <p class="text-yellow-700">{{ roundResult }}</p>
            </div>

            <!-- Next Round Button -->
            <button
              @click="nextRound"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              ➡️ Next Round
            </button>
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
          <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">🤖 AI Pets ({{ opponentDeck.length }})</h2>
          
          <!-- AI's Played Card -->
          <div v-if="opponentCard" class="mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <div class="text-center">
              <div class="text-4xl mb-2">{{ opponentCard.image }}</div>
              <h3 class="font-semibold text-lg">{{ opponentCard.name }}</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div
                  v-for="[attr, value] in Object.entries(opponentCard.attributes)"
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
              v-for="(card, index) in opponentDeck"
              :key="card.id"
              class="p-3 bg-gray-100 rounded-lg border-2 border-gray-300"
            >
              <div class="text-center">
                <div class="text-2xl mb-1">❓</div>
                <div class="text-sm font-medium text-gray-500">Hidden</div>
                <div class="text-xs text-gray-400">Pet {{ index + 1 }}</div>
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
