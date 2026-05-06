<template>
  <div class="bg-secondary-500 px-4 py-3 text-white">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-center sm:gap-4">
      <router-link
        to="/workshops"
        class="text-sm font-semibold uppercase tracking-[0.14em] transition-colors hover:text-white/85"
      >
        Browse Workshops
      </router-link>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-900 shadow-sm transition-colors hover:bg-dark-50"
        @click="goToSchedule"
      >
        Schedule
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const scrollToSchedule = (attempt = 0) => {
  const scheduleSection = document.getElementById('home_schedule')

  if (scheduleSection) {
    scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  if (attempt < 10) {
    window.setTimeout(() => scrollToSchedule(attempt + 1), 150)
  }
}

const goToSchedule = async () => {
  await router.push({ path: '/', hash: '#home_schedule' })
  await nextTick()
  scrollToSchedule()
}
</script>
