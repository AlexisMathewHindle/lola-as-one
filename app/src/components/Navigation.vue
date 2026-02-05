<template>
  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center">
          <span class="text-2xl font-display font-bold text-primary-600">
            Lola As One
          </span>
        </router-link>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            to="/workshops" 
            class="text-gray-700 hover:text-primary-600 transition-colors"
          >
            Workshops
          </router-link>
          
          <router-link 
            to="/boxes" 
            class="text-gray-700 hover:text-secondary-600 transition-colors"
          >
            Boxes
          </router-link>
          
          <router-link 
            to="/blog" 
            class="text-gray-700 hover:text-primary-600 transition-colors"
          >
            Blog
          </router-link>
          
          <router-link 
            to="/about" 
            class="text-gray-700 hover:text-primary-600 transition-colors"
          >
            About
          </router-link>
          
          <router-link 
            to="/contact" 
            class="text-gray-700 hover:text-primary-600 transition-colors"
          >
            Contact
          </router-link>
        </div>
        
        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Cart -->
          <router-link
            to="/cart"
            class="relative text-gray-700 hover:text-primary-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartStore.itemCount }}
            </span>
          </router-link>
          
          <!-- Account -->
          <router-link 
            v-if="authStore.isAuthenticated"
            to="/account"
            class="text-gray-700 hover:text-primary-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </router-link>
          
          <router-link 
            v-else
            to="/login"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </router-link>
          
          <!-- Admin Link -->
          <router-link 
            v-if="authStore.isAdmin"
            to="/admin"
            class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Admin
          </router-link>
        </div>
        
        <!-- Mobile Menu Button -->
        <button 
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 space-y-2">
        <router-link
          to="/workshops"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          Workshops
        </router-link>
        <router-link
          to="/boxes"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          Boxes
        </router-link>
        <router-link
          to="/blog"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          Blog
        </router-link>
        <router-link
          to="/about"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          About
        </router-link>
        <router-link
          to="/contact"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          Contact
        </router-link>
        <router-link
          to="/cart"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          <div class="flex items-center justify-between">
            <span>Cart</span>
            <span
              v-if="cartStore.itemCount > 0"
              class="bg-primary-600 text-white text-xs rounded-full px-2 py-1"
            >
              {{ cartStore.itemCount }}
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const mobileMenuOpen = ref(false)
</script>

