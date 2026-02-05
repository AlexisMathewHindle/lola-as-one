import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 0

  function show(message, type = 'success', duration = 4000) {
    const id = nextId++
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration
    }

    toasts.value.push(toast)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function remove(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message, duration = 4000) {
    return show(message, 'success', duration)
  }

  function error(message, duration = 5000) {
    return show(message, 'error', duration)
  }

  function info(message, duration = 4000) {
    return show(message, 'info', duration)
  }

  function warning(message, duration = 4000) {
    return show(message, 'warning', duration)
  }

  function clear() {
    toasts.value = []
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    info,
    warning,
    clear
  }
})

