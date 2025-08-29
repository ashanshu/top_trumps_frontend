<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()

const currentPlayer = computed(() => gameStore.currentPlayer)
const isMyTurn = computed(() => {
  if (!gameStore.currentGame || !currentPlayer.value) return false
  return gameStore.currentGame.currentPlayerIndex === 0 // Assuming current user is always player 0
})

const handleAttributeSelect = (attribute: string) => {
  gameStore.selectAttribute(attribute)
}

const handleCardSelect = (card: any) => {
  gameStore.selectCard(card)
}

const handlePlayCard = () => {
  if (gameStore.selectedCard && gameStore.selectedAttribute) {
    gameStore.playCard()
  }
}
</script>

<template>
  <div v-if="gameStore.isGameActive" class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">🎴 Top Trumps Game</h2>
    
    <!-- Game Status -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-medium text-blue-800">Round {{ gameStore.currentGame?.round }}</h3>
          <p class="text-sm text-blue-600">
            {{ isMyTurn ? 'Your turn!' : 'Waiting for opponent...' }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-blue-600">Players: {{ gameStore.currentGame?.players.length }}</p>
        </div>
      </div>
    </div>
    
    <!-- Game Board -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Player Area -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-700">Your Cards</h3>
        
        <!-- Selected Card -->
        <div v-if="gameStore.selectedCard" class="border-2 border-blue-500 rounded-lg p-4">
          <h4 class="font-medium text-gray-800 mb-3">{{ gameStore.selectedCard.name }}</h4>
          <div class="space-y-2">
            <div 
              v-for="(value, attribute) in gameStore.selectedCard.attributes" 
              :key="attribute"
              class="flex justify-between items-center p-2 rounded cursor-pointer transition-colors"
              :class="{
                'bg-blue-100 border border-blue-300': gameStore.selectedAttribute === attribute,
                'bg-gray-50 hover:bg-gray-100': gameStore.selectedAttribute !== attribute
              }"
              @click="handleAttributeSelect(attribute)"
            >
              <span class="font-medium text-gray-700">{{ attribute }}</span>
              <span class="text-lg font-bold text-blue-600">{{ value }}</span>
            </div>
          </div>
          
          <div class="mt-4">
            <button
              @click="handlePlayCard"
              :disabled="!gameStore.selectedAttribute"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Play Card
            </button>
          </div>
        </div>
        
        <!-- Card Selection -->
        <div v-else class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🎴</div>
          <p>Select a card to play</p>
        </div>
      </div>
      
      <!-- Opponent Area -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-700">Opponent</h3>
        
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">👤</div>
          <p>Opponent's turn</p>
        </div>
      </div>
    </div>
    
    <!-- Game Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <button
        @click="gameStore.resetGame"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        End Game
      </button>
    </div>
  </div>
</template>
