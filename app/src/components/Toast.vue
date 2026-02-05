<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm w-full bg-white rounded-lg shadow-lg border overflow-hidden"
        :class="borderColorClass(toast.type)"
      >
        <div class="p-4 flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="iconBgClass(toast.type)"
            >
              <font-awesome-icon
                :icon="iconName(toast.type)"
                :class="iconColorClass(toast.type)"
                class="w-5 h-5"
              />
            </div>
          </div>

          <!-- Content -->
          <div class="ml-3 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="toastStore.remove(toast.id)"
              class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
            >
              <font-awesome-icon icon="times" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          v-if="toast.duration > 0"
          class="h-1 w-full"
          :class="progressBgClass(toast.type)"
        >
          <div
            class="h-full transition-all ease-linear"
            :class="progressBarClass(toast.type)"
            :style="{
              width: '100%',
              animation: `shrink ${toast.duration}ms linear forwards`
            }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()

const iconName = (type) => {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'bell'
  }
  return icons[type] || 'bell'
}

const iconBgClass = (type) => {
  const classes = {
    success: 'bg-success-100',
    error: 'bg-danger-100',
    warning: 'bg-yellow-100',
    info: 'bg-primary-100'
  }
  return classes[type] || 'bg-gray-100'
}

const iconColorClass = (type) => {
  const classes = {
    success: 'text-success-600',
    error: 'text-danger-600',
    warning: 'text-yellow-600',
    info: 'text-primary-600'
  }
  return classes[type] || 'text-gray-600'
}

const borderColorClass = (type) => {
  const classes = {
    success: 'border-success-200',
    error: 'border-danger-200',
    warning: 'border-yellow-200',
    info: 'border-primary-200'
  }
  return classes[type] || 'border-gray-200'
}

const progressBgClass = (type) => {
  const classes = {
    success: 'bg-success-100',
    error: 'bg-danger-100',
    warning: 'bg-yellow-100',
    info: 'bg-primary-100'
  }
  return classes[type] || 'bg-gray-100'
}

const progressBarClass = (type) => {
  const classes = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    warning: 'bg-yellow-500',
    info: 'bg-primary-500'
  }
  return classes[type] || 'bg-gray-500'
}
</script>

<style scoped>
/* Toast transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

/* Progress bar shrink animation */
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>

