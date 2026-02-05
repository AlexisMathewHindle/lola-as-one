<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2 sm:mb-4">
          Creative Workshops
        </h1>
        <p class="text-base sm:text-lg text-gray-600">
          Discover hands-on creative experiences at Lola Creative Space
        </p>
      </div>

      <!-- Calendar Controls -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <!-- Navigation -->
          <div class="flex items-center justify-between sm:justify-start space-x-2">
            <button
              @click="previousWeek"
              class="p-2 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              :title="viewMode === 'week' ? 'Previous week' : 'Previous day'"
            >
              <font-awesome-icon icon="chevron-left" class="w-5 h-5" />
            </button>
            <button
              @click="goToToday"
              class="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors touch-manipulation text-sm sm:text-base"
            >
              today
            </button>
            <button
              @click="nextWeek"
              class="p-2 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              :title="viewMode === 'week' ? 'Next week' : 'Next day'"
            >
              <font-awesome-icon icon="chevron-right" class="w-5 h-5" />
            </button>
          </div>

          <!-- View Toggle - Hidden on mobile (auto day view) -->
          <div class="hidden sm:flex items-center space-x-2">
            <button
              @click="viewMode = 'week'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              week
            </button>
            <button
              @click="viewMode = 'day'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                viewMode === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              day
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="spinner" spin class="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <p class="text-gray-600">Loading workshops...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <font-awesome-icon icon="exclamation-circle" class="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p class="text-red-800 font-medium mb-2">Failed to load workshops</p>
        <p class="text-red-600 text-sm mb-4">{{ error }}</p>
        <button
          @click="fetchWorkshops"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Calendar View -->
      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <!-- Week View (Desktop only - ≥850px) -->
        <div v-if="viewMode === 'week' && !isMobileView" class="overflow-x-auto">
          <!-- Date Headers -->
          <div class="grid grid-cols-8 border-b border-gray-200 bg-gray-50 min-w-[800px]">
            <div class="p-3 lg:p-4 text-sm font-medium text-gray-500 w-16 lg:w-20"></div>
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="p-3 lg:p-4 text-center border-l border-gray-200"
              :class="isToday(day.date) ? 'bg-primary-100' : ''"
            >
              <div class="text-sm font-medium" :class="isToday(day.date) ? 'text-primary-700' : 'text-gray-900'">
                {{ day.dayName }}
              </div>
              <div class="text-xs" :class="isToday(day.date) ? 'text-primary-600 font-semibold' : 'text-gray-500'">
                {{ day.dateLabel }}
              </div>
            </div>
          </div>

          <!-- Time Grid -->
          <div class="grid grid-cols-8 min-w-[800px]">
            <!-- Time Labels Column -->
            <div class="border-r border-gray-200 w-16 lg:w-20">
              <div
                v-for="time in timeSlots"
                :key="time"
                class="h-16 px-1 lg:px-2 py-1 text-xs text-gray-500 text-right border-b border-gray-100"
              >
                {{ time }}
              </div>
            </div>

            <!-- Day Columns -->
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="relative border-l border-gray-200 min-w-[100px]"
            >
              <!-- Time Slot Backgrounds -->
              <div
                v-for="time in timeSlots"
                :key="time"
                class="h-16 border-b border-gray-100"
                :class="isToday(day.date) ? 'bg-blue-50/30' : ''"
              ></div>

              <!-- Workshop Blocks -->
              <div
                v-for="workshop in getWorkshopsForDay(day.date)"
                :key="workshop.id"
                :style="getWorkshopStyle(workshop)"
                @click="goToWorkshop(workshop)"
                class="absolute left-1 right-1 rounded-lg p-2 transition-shadow overflow-hidden touch-manipulation"
                :class="[
                  isPastEvent(workshop)
                    ? 'bg-gray-300 opacity-60 cursor-not-allowed'
                    : `${getWorkshopColorClass(workshop)} cursor-pointer hover:shadow-lg active:shadow-xl`
                ]"
              >
                <div class="text-xs font-semibold mb-1" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-white'">
                  {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                </div>
                <div class="text-xs lg:text-sm font-medium line-clamp-2" :class="isPastEvent(workshop) ? 'text-gray-700' : 'text-white'">
                  {{ workshop.offering.title }}
                </div>
                <div v-if="workshop.age_group" class="text-xs mt-1 hidden lg:block" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-white/90'">
                  {{ workshop.age_group }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day View (Mobile - always shown, Desktop - when day mode) -->
        <div v-if="viewMode === 'day'" class="block">
          <!-- Date Header -->
          <div class="border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div class="text-center">
              <div class="text-base sm:text-lg font-semibold text-gray-900">{{ currentDayName }}</div>
              <div class="text-xs sm:text-sm text-gray-500">{{ currentDateLabel }}</div>
            </div>
          </div>

          <!-- Time Grid -->
          <div class="grid grid-cols-[70px_1fr] sm:grid-cols-2">
            <!-- Time Labels Column -->
            <div class="border-r border-gray-200">
              <div
                v-for="time in timeSlots"
                :key="time"
                class="h-16 sm:h-20 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 text-right border-b border-gray-100"
              >
                {{ time }}
              </div>
            </div>

            <!-- Day Column -->
            <div class="relative">
              <!-- Time Slot Backgrounds -->
              <div
                v-for="time in timeSlots"
                :key="time"
                class="h-16 sm:h-20 border-b border-gray-100 bg-blue-50/30"
              ></div>

              <!-- Workshop Blocks -->
              <div
                v-for="workshop in getWorkshopsForDay(currentDateString)"
                :key="workshop.id"
                :style="getWorkshopStyleDayMobile(workshop)"
                @click="goToWorkshop(workshop)"
                class="absolute left-2 right-2 rounded-lg p-2 sm:p-3 transition-shadow touch-manipulation"
                :class="[
                  isPastEvent(workshop)
                    ? 'bg-gray-300 opacity-60 cursor-not-allowed'
                    : `${getWorkshopColorClass(workshop)} cursor-pointer hover:shadow-lg active:shadow-xl`
                ]"
              >
                <div class="text-xs sm:text-sm font-semibold mb-1" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-white'">
                  {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                </div>
                <div class="text-sm sm:text-base font-medium mb-1 line-clamp-2" :class="isPastEvent(workshop) ? 'text-gray-700' : 'text-white'">
                  {{ workshop.offering.title }}
                </div>
                <div v-if="workshop.age_group" class="text-xs sm:text-sm" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-white/90'">
                  {{ workshop.age_group }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View (Mobile only - <850px) -->
        <div v-if="viewMode === 'week' && isMobileView">
          <!-- Week workshops grouped by date -->
          <div v-for="day in weekDays" :key="day.date" class="border-b border-gray-200 last:border-b-0">
            <!-- Date Header -->
            <div
              class="sticky top-0 bg-gray-50 px-4 py-3 border-b border-gray-200"
              :class="isToday(day.date) ? 'bg-primary-50' : ''"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold" :class="isToday(day.date) ? 'text-primary-700' : 'text-gray-900'">
                    {{ day.dayName }}
                  </div>
                  <div class="text-xs" :class="isToday(day.date) ? 'text-primary-600' : 'text-gray-500'">
                    {{ day.dateLabel }}
                  </div>
                </div>
                <div v-if="isToday(day.date)" class="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">
                  Today
                </div>
              </div>
            </div>

            <!-- Workshops for this day -->
            <div v-if="getWorkshopsForDay(day.date).length > 0" class="divide-y divide-gray-100">
              <div
                v-for="workshop in getWorkshopsForDay(day.date)"
                :key="workshop.id"
                @click="goToWorkshop(workshop)"
                class="p-4 transition-colors touch-manipulation"
                :class="[
                  isPastEvent(workshop)
                    ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
                ]"
              >
                <div class="flex items-start gap-3">
                  <!-- Time Badge -->
                  <div
                    class="flex-shrink-0 px-2 py-1 rounded text-xs font-semibold min-w-[70px] text-center"
                    :class="isPastEvent(workshop) ? 'bg-gray-200 text-gray-600' : `${getWorkshopColorClass(workshop)} text-white`"
                  >
                    {{ formatTime(workshop.event_start_time) }}
                  </div>

                  <!-- Workshop Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold mb-1" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-gray-900'">
                      {{ workshop.offering.title }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span v-if="workshop.event_end_time">
                        {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                      </span>
                      <span v-if="workshop.age_group" class="inline-flex items-center">
                        <span class="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
                        {{ workshop.age_group }}
                      </span>
                    </div>
                  </div>

                  <!-- Arrow Icon -->
                  <div v-if="!isPastEvent(workshop)" class="flex-shrink-0 text-gray-400">
                    <font-awesome-icon icon="chevron-right" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <!-- No workshops message -->
            <div v-else class="p-4 text-center text-sm text-gray-500">
              No workshops scheduled
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="workshops.length === 0" class="p-12 text-center">
          <font-awesome-icon icon="calendar" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No workshops scheduled</h3>
          <p class="text-gray-600">Check back soon for upcoming workshops!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

// State
const workshops = ref([])
const loading = ref(true)
const error = ref(null)
const currentDate = ref(new Date())
const viewMode = ref('week')
const windowWidth = ref(window.innerWidth)

// Mobile detection (using 850px as breakpoint)
const isMobileView = computed(() => windowWidth.value < 850)

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
  // Keep week view for all screen sizes
}

// Time slots (9am - 6pm in 30-minute increments)
const timeSlots = [
  '9am', '9:30am', '10am', '10:30am', '11am', '11:30am',
  '12pm', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm',
  '3pm', '3:30pm', '4pm', '4:30pm', '5pm', '5:30pm', '6pm'
]

// Get start of week (Monday)
const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

// Get week days
const weekDays = computed(() => {
  const start = getStartOfWeek(currentDate.value)
  const days = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    })
  }

  return days
})

// Current day info (for day view)
const currentDateString = computed(() => {
  return currentDate.value.toISOString().split('T')[0]
})

const currentDayName = computed(() => {
  return currentDate.value.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
})

const currentDateLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
})

// Check if date is today
const isToday = (dateString) => {
  const today = new Date().toISOString().split('T')[0]
  return dateString === today
}

// Check if event is in the past
const isPastEvent = (workshop) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day

  const eventDate = new Date(workshop.event_date)
  eventDate.setHours(0, 0, 0, 0)

  // If event is on a past date, it's definitely past
  if (eventDate < today) {
    return true
  }

  // If event is today, check the time
  if (eventDate.getTime() === today.getTime() && workshop.event_start_time) {
    const now = new Date()
    const [hours, minutes] = workshop.event_start_time.split(':').map(Number)
    const eventDateTime = new Date()
    eventDateTime.setHours(hours, minutes, 0, 0)

    return eventDateTime < now
  }

  return false
}

// Fetch workshops
const fetchWorkshops = async () => {
  try {
    loading.value = true
    error.value = null

    // Get date range based on view mode
    let startDate, endDate

    if (viewMode.value === 'week') {
      const start = getStartOfWeek(currentDate.value)
      startDate = start.toISOString().split('T')[0]
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      endDate = end.toISOString().split('T')[0]
    } else {
      startDate = currentDate.value.toISOString().split('T')[0]
      endDate = startDate
    }

    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*),
        capacity:event_capacity(*)
      `)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .eq('offering.status', 'published')
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })

    if (fetchError) {
      console.error('Supabase error:', fetchError)
      throw fetchError
    }

    console.log('Fetched workshops:', data)
    console.log('Date range:', startDate, 'to', endDate)

    // Process workshops with age group from metadata
    workshops.value = (data || []).map(workshop => {
      const metadata = workshop.offering?.metadata || {}
      const category = metadata.category || ''

      // Extract age group
      let ageGroup = ''
      if (metadata.age_group) {
        ageGroup = metadata.age_group
      } else if (workshop.offering?.title.includes('all ages')) {
        ageGroup = '(all ages)'
      } else if (workshop.offering?.title.match(/\(ages? [\d-+]+\)/i)) {
        const match = workshop.offering.title.match(/\((ages? [\d-+]+)\)/i)
        ageGroup = match ? `(${match[1]})` : ''
      }

      return {
        ...workshop,
        category,
        age_group: ageGroup
      }
    })

    console.log('Processed workshops:', workshops.value)
  } catch (err) {
    console.error('Error fetching workshops:', err)
    error.value = 'Failed to load workshops. Please try again.'
  } finally {
    loading.value = false
  }
}

// Get workshops for a specific day
const getWorkshopsForDay = (dateString) => {
  return workshops.value.filter(w => w.event_date === dateString)
}

// Get workshop color class based on category/title
const getWorkshopColorClass = (workshop) => {
  const title = workshop.offering.title.toLowerCase()
  const category = workshop.category?.toLowerCase() || ''

  // Open Studio - Blue/Teal
  if (title.includes('open studio')) {
    return 'bg-blue-500 hover:bg-blue-600'
  }

  // Storytelling, Creative activities - Orange
  if (title.includes('storytelling') || title.includes('storytime')) {
    return 'bg-orange-500 hover:bg-orange-600'
  }

  // Little Ones classes (ages 2-4) - Brown/Tan
  if (title.includes('little ones') || title.includes('ages 2-4')) {
    return 'bg-amber-700 hover:bg-amber-800'
  }

  // Private Party, Special events - Yellow/Gold
  if (title.includes('private') || title.includes('party')) {
    return 'bg-yellow-500 hover:bg-yellow-600'
  }

  // Creative Saturdays - Orange
  if (title.includes('creative saturdays')) {
    return 'bg-orange-500 hover:bg-orange-600'
  }

  // Default - Primary color
  return 'bg-primary-600 hover:bg-primary-700'
}

// Calculate workshop position and height
const getWorkshopStyle = (workshop) => {
  const startTime = workshop.event_start_time
  const endTime = workshop.event_end_time || workshop.event_start_time

  // Convert time to minutes from 9am
  const startMinutes = timeToMinutes(startTime) - (9 * 60)
  const endMinutes = timeToMinutes(endTime) - (9 * 60)
  const duration = endMinutes - startMinutes

  // Each 30-minute slot is 64px (h-16 = 4rem = 64px)
  const pixelsPerMinute = 64 / 30
  const top = startMinutes * pixelsPerMinute
  const height = duration * pixelsPerMinute

  return {
    top: `${top}px`,
    height: `${Math.max(height, 40)}px` // Minimum height
  }
}

// Calculate workshop position and height for day view (larger slots)
const getWorkshopStyleDay = (workshop) => {
  const startTime = workshop.event_start_time
  const endTime = workshop.event_end_time || workshop.event_start_time

  // Convert time to minutes from 9am
  const startMinutes = timeToMinutes(startTime) - (9 * 60)
  const endMinutes = timeToMinutes(endTime) - (9 * 60)
  const duration = endMinutes - startMinutes

  // Each 30-minute slot is 80px (h-20 = 5rem = 80px)
  const pixelsPerMinute = 80 / 30
  const top = startMinutes * pixelsPerMinute
  const height = duration * pixelsPerMinute

  return {
    top: `${top}px`,
    height: `${Math.max(height, 60)}px` // Minimum height
  }
}

// Calculate workshop position and height for day view on mobile (smaller slots)
const getWorkshopStyleDayMobile = (workshop) => {
  const startTime = workshop.event_start_time
  const endTime = workshop.event_end_time || workshop.event_start_time

  // Convert time to minutes from 9am
  const startMinutes = timeToMinutes(startTime) - (9 * 60)
  const endMinutes = timeToMinutes(endTime) - (9 * 60)
  const duration = endMinutes - startMinutes

  // Each 30-minute slot is 64px on mobile (h-16), 80px on desktop (h-20)
  const pixelsPerMinute = isMobileView.value ? (64 / 30) : (80 / 30)
  const top = startMinutes * pixelsPerMinute
  const height = duration * pixelsPerMinute
  const minHeight = isMobileView.value ? 48 : 60

  return {
    top: `${top}px`,
    height: `${Math.max(height, minHeight)}px`
  }
}

// Convert time string to minutes
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// Format single time (e.g., "14:30" -> "2:30pm")
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const period = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${displayHour}:${minutes}${period}`
}

// Format time range
const formatTimeRange = (startTime, endTime) => {
  if (!endTime) return formatTime(startTime)
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

// Navigation
const previousWeek = () => {
  const newDate = new Date(currentDate.value)
  // Always navigate by week (7 days)
  newDate.setDate(newDate.getDate() - 7)
  currentDate.value = newDate
  fetchWorkshops()
}

const nextWeek = () => {
  const newDate = new Date(currentDate.value)
  // Always navigate by week (7 days)
  newDate.setDate(newDate.getDate() + 7)
  currentDate.value = newDate
  fetchWorkshops()
}

const goToToday = () => {
  currentDate.value = new Date()
  fetchWorkshops()
}

// Navigate to workshop detail
const goToWorkshop = (workshop) => {
  // Don't navigate if event is in the past
  if (isPastEvent(workshop)) {
    return
  }
  router.push(`/workshops/${workshop.offering.slug}`)
}

// Initialize
onMounted(() => {
  // Always start with week view
  viewMode.value = 'week'

  window.addEventListener('resize', handleResize)
  fetchWorkshops()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
