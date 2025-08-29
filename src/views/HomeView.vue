<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebSocketStore } from '../stores/websocket'
import { useGameStore } from '../stores/game'

const router = useRouter()
const websocketStore = useWebSocketStore()
const gameStore = useGameStore()

// Don't auto-connect - let users manually connect to the backend
// onMounted(() => {
//   websocketStore.connect()
// })

// Don't disconnect WebSocket when navigating - keep connection alive for multiplayer
// onUnmounted(() => {
//   websocketStore.disconnect()
// })

const handleConnect = () => {
  let serverUrl
  if (selectedServer.value === 'local') {
    serverUrl = 'ws://localhost:8080/ws'
  } else {
    serverUrl = 'ws://13.223.180.228:8080'
  }
  console.log('Connecting to server:', serverUrl)
  websocketStore.connect(serverUrl)
}

const handleDisconnect = () => {
  websocketStore.disconnect()
}

const handleSendTestMessage = () => {
  websocketStore.sendMessage({
    type: 'test',
    data: { 
      message: 'Hello from Top Trumps client!',
      client: 'Vue.js Frontend',
      timestamp: new Date().toISOString()
    }
  })
}

const selectedServer = ref('production') // Default to production server
const playerName = ref('')
const showJoinRoom = ref(false)

const handleJoinRoom = () => {
  if (!playerName.value.trim()) {
    alert('Please enter your name')
    return
  }
  
  if (websocketStore.joinRoom('room1', playerName.value.trim())) {
    router.push('/game')
  } else {
    alert('Failed to join room. Please check your connection.')
  }
}

const goToGame = () => {
  console.log('Navigating to game...')
  console.log('Current route:', router.currentRoute.value.path)
  router.push('/game')
  console.log('Navigation complete')
}
</script>

<template>
  <main class="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">🐾 Top Trumps - Pet Battle</h1>
        <p class="text-lg text-gray-600">The ultimate pet comparison game</p>
      </div>

      <!-- Connection Status Card -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Connection Status</h2>
        
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div 
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': websocketStore.isConnected,
                  'bg-yellow-500': websocketStore.connectionStatus === 'connecting',
                  'bg-red-500': websocketStore.connectionStatus === 'error',
                  'bg-gray-400': websocketStore.connectionStatus === 'disconnected'
                }"
              ></div>
              <span class="font-medium" :class="websocketStore.statusColor">
                {{ websocketStore.statusText }}
              </span>
            </div>
            <!-- Current Server Display -->
            <div v-if="websocketStore.isConnected" class="text-sm text-gray-600">
              <span class="font-medium">Server:</span> 
              {{ selectedServer === 'local' ? 'localhost:8080' : '13.223.180.228:8080' }}
            </div>
          </div>
          
          <!-- Server Selection -->
          <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Server:</label>
            <div class="flex space-x-3">
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="selectedServer" 
                  value="local" 
                  class="mr-2"
                  :disabled="websocketStore.isConnected"
                />
                <span class="text-sm">Local (localhost:8080)</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="selectedServer" 
                  value="production" 
                  class="mr-2"
                  :disabled="websocketStore.isConnected"
                />
                <span class="text-sm">Production (13.223.180.228:8080)</span>
              </label>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button
              @click="handleConnect"
              :disabled="websocketStore.isConnected"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Connect
            </button>
            <button
              @click="handleDisconnect"
              :disabled="!websocketStore.isConnected"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <!-- Connection Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span class="font-medium">Status:</span> {{ websocketStore.connectionStatus }}
          </div>
          <div>
            <span class="font-medium">Reconnect Attempts:</span> {{ websocketStore.reconnectAttempts }}
          </div>
          <div>
            <span class="font-medium">Messages Received:</span> {{ websocketStore.messageHistory.length }}
          </div>
          <div>
            <span class="font-medium">Last Message:</span> 
            {{ websocketStore.lastMessage ? new Date(websocketStore.lastMessage.timestamp).toLocaleTimeString() : 'None' }}
          </div>
        </div>

        <!-- Test Message Button -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="handleSendTestMessage"
            :disabled="!websocketStore.isConnected"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send Test Message
          </button>
        </div>
      </div>

      <!-- Game Status Card -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Game Status</h2>
        
        <div class="text-center py-8">
          <div class="text-6xl mb-4">🐾</div>
          <p class="text-gray-600 mb-4">
            {{ websocketStore.isConnected ? 'Ready to play!' : 'Connect to server to start playing' }}
          </p>
          
          <!-- Multiplayer Game Buttons -->
          <div v-if="websocketStore.isConnected" class="space-y-6">
            <!-- Join Room 1 Button -->
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <input
                  v-model="playerName"
                  type="text"
                  placeholder="Enter your name"
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @keyup.enter="handleJoinRoom"
                />
                <button 
                  @click="handleJoinRoom"
                  :disabled="!playerName.trim()"
                  class="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  🎮 Join Room 1
                </button>
              </div>
              <p class="text-sm text-gray-500">Join multiplayer game and wait for an opponent!</p>
            </div>
            
            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-gray-50 text-gray-500">OR</span>
              </div>
            </div>
            
            <!-- Play with AI Button -->
            <button 
              @click="goToGame"
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              🤖 Play with AI
            </button>
            <p class="text-sm text-gray-500">Challenge our AI opponent in a classic Top Trumps pet battle!</p>
            
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold text-gray-700 mb-2">🐾 How to Play:</h3>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• You'll get 10 adorable pet cards</li>
                <li>• Choose a pet and select its best attribute</li>
                <li>• AI will reveal its pet and compare attributes</li>
                <li>• Higher attribute value wins the round</li>
                <li>• First to win all pets wins the game!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message History -->
      <div v-if="websocketStore.messageHistory.length > 0" class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Message History</h2>
        
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(message, index) in websocketStore.messageHistory.slice().reverse()"
            :key="index"
            class="p-3 bg-gray-50 rounded-lg text-sm"
          >
            <div class="flex justify-between items-start">
              <span class="font-medium text-gray-700">{{ message.type }}</span>
              <span class="text-gray-500 text-xs">
                {{ new Date(message.timestamp).toLocaleTimeString() }}
              </span>
            </div>
            <pre class="text-gray-600 mt-1 text-xs overflow-x-auto">{{ JSON.stringify(message.data, null, 2) }}</pre>
          </div>
        </div>
        
        <button
          @click="websocketStore.clearMessageHistory"
          class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Clear History
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Custom scrollbar for message history */
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
