<template>
  <div>
    <div class="mb-5 sm:mb-6">
      <div class="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div class="flex items-center justify-between space-x-2 sm:justify-start">
          <button
            @click="previousPeriod"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e7d7b8] bg-white text-[#d1a13b] transition-colors touch-manipulation hover:bg-[#fbf7ef]"
            :title="viewMode === 'week' ? 'Previous week' : 'Previous day'"
          >
            <font-awesome-icon icon="chevron-left" class="h-5 w-5" />
          </button>
          <button
            @click="goToToday"
            class="rounded-md border border-[#e7d7b8] bg-white px-4 py-2 text-sm font-medium text-[#d1a13b] transition-colors touch-manipulation hover:bg-[#fbf7ef] sm:text-base"
          >
            today
          </button>
          <button
            @click="nextPeriod"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e7d7b8] bg-white text-[#d1a13b] transition-colors touch-manipulation hover:bg-[#fbf7ef]"
            :title="viewMode === 'week' ? 'Next week' : 'Next day'"
          >
            <font-awesome-icon icon="chevron-right" class="h-5 w-5" />
          </button>
        </div>

        <div v-if="showViewToggle" class="hidden items-center sm:flex">
          <button
            @click="viewMode = 'week'"
            :class="[
              'min-w-16 rounded-l-md rounded-r-none border border-[#e7d7b8] px-5 py-2 text-sm font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-[#cda448] text-white'
                : 'bg-white text-stone-700 hover:bg-[#fbf7ef]'
            ]"
          >
            week
          </button>
          <button
            @click="viewMode = 'day'"
            :class="[
              '-ml-px min-w-16 rounded-r-md rounded-l-none border border-[#e7d7b8] px-5 py-2 text-sm font-medium transition-colors',
              viewMode === 'day'
                ? 'bg-[#cda448] text-white'
                : 'bg-white text-stone-700 hover:bg-[#fbf7ef]'
            ]"
          >
            day
          </button>
        </div>
      </div>
    </div>

    <div v-if="isInitialLoading" class="rounded-md border border-[#e5ded0] bg-white p-12 text-center">
      <font-awesome-icon icon="spinner" spin class="mx-auto mb-4 h-12 w-12 text-primary-600" />
      <p class="text-gray-600">Loading workshops...</p>
    </div>

    <div v-else-if="showFullError" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <font-awesome-icon icon="exclamation-circle" class="mx-auto mb-4 h-12 w-12 text-red-600" />
      <p class="mb-2 font-medium text-red-800">Failed to load workshops</p>
      <p class="mb-4 text-sm text-red-600">{{ error }}</p>
      <button
        @click="fetchWorkshops"
        class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
      >
        Try Again
      </button>
    </div>

    <div v-else class="relative overflow-hidden rounded-md border border-[#e5ded0] bg-white">
      <div
        v-if="showRefreshOverlay"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]"
        aria-hidden="true"
      >
        <div class="rounded-full bg-white/90 px-4 py-3 shadow-sm">
          <font-awesome-icon icon="spinner" spin class="h-6 w-6 text-primary-600" />
        </div>
      </div>

      <div v-if="error" class="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {{ error }}
      </div>

      <div v-if="viewMode === 'week' && !isMobileView" class="overflow-x-auto">
        <div class="grid min-w-[980px] grid-cols-8 border-b border-[#e5ded0] bg-[#faf8f3]">
          <div class="w-20 p-3 text-sm font-medium text-stone-500 lg:w-24 lg:p-4"></div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="border-l border-[#e5ded0] p-3 text-center lg:p-4"
            :class="isToday(day.date) ? 'bg-[#f5ecd8]' : ''"
          >
            <div class="text-sm font-medium" :class="isToday(day.date) ? 'text-[#d1a13b]' : 'text-stone-700'">
              {{ day.dayName }}
            </div>
            <div class="text-xs" :class="isToday(day.date) ? 'font-semibold text-[#d1a13b]' : 'text-stone-500'">
              {{ day.dateLabel }}
            </div>
          </div>
        </div>

        <div class="grid min-w-[980px] grid-cols-8">
          <div class="border-r border-[#e5ded0]">
            <div
              v-for="time in timeSlots"
              :key="time"
              class="border-b px-3 py-1 text-right text-sm text-stone-500 lg:px-4"
              :class="isHourMark(time) ? 'border-[#ebe4d7]' : 'border-transparent'"
              :style="weekSlotStyle"
            >
              {{ isHourMark(time) ? time : '' }}
            </div>
          </div>

          <div
            v-for="day in weekDays"
            :key="day.date"
            class="relative min-w-[120px] border-l border-[#e5ded0]"
            :style="weekGridColumnStyle"
          >
            <div
              v-for="time in timeSlots"
              :key="time"
              class="border-b"
              :class="isHourMark(time) ? 'border-[#ebe4d7]' : 'border-transparent'"
              :style="weekSlotStyle"
            ></div>

            <div
              v-for="workshop in getWorkshopsForDay(day.date)"
              :key="workshop.id"
              :style="getWeekWorkshopStyle(day.date, workshop)"
              @click="goToWorkshop(workshop)"
              class="absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 transition-shadow touch-manipulation lg:px-2.5 lg:py-1.5"
              :class="[
                isPastEvent(workshop)
                  ? 'cursor-not-allowed bg-gray-300 opacity-60'
                  : `${getWorkshopColorClass(workshop)} cursor-pointer hover:shadow-lg active:shadow-xl`
              ]"
            >
              <div
                class="mb-0.5 text-xs font-semibold leading-tight"
                :class="getWorkshopPrimaryTextClass(workshop, 'text-gray-600')"
                :style="getWorkshopPrimaryTextStyle(workshop)"
              >
                {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
              </div>
              <div
                class="line-clamp-2 text-[13px] font-medium leading-tight lg:text-sm"
                :class="getWorkshopPrimaryTextClass(workshop, 'text-gray-700')"
                :style="getWorkshopPrimaryTextStyle(workshop)"
              >
                {{ getWorkshopCalendarName(workshop) }}
              </div>
              <div
                v-if="workshop.age_group && shouldShowWorkshopAgeInGrid(workshop)"
                class="mt-0.5 hidden text-xs leading-tight lg:block"
                :class="getWorkshopSecondaryTextClass(workshop, 'text-gray-600')"
                :style="getWorkshopSecondaryTextStyle(workshop)"
              >
                {{ workshop.age_group }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'day'" class="block">
        <div class="border-b border-[#e5ded0] bg-[#faf8f3] p-3 sm:p-4">
          <div class="text-center">
            <div class="text-base font-semibold text-stone-700 sm:text-lg">{{ currentDayName }}</div>
            <div class="text-xs text-stone-500 sm:text-sm">{{ currentDateLabel }}</div>
          </div>
        </div>

        <div class="grid grid-cols-[70px_1fr] sm:grid-cols-2">
          <div class="border-r border-[#e5ded0]" :style="dayGridColumnStyle">
            <div
              v-for="time in timeSlots"
              :key="time"
              class="border-b px-2 py-2 text-right text-xs text-stone-500 sm:px-4 sm:text-sm"
              :class="isHourMark(time) ? 'border-[#ebe4d7]' : 'border-transparent'"
              :style="daySlotStyle"
            >
              {{ isHourMark(time) ? time : '' }}
            </div>
          </div>

          <div class="relative" :style="dayGridColumnStyle">
            <div
              v-for="time in timeSlots"
              :key="time"
              class="border-b"
              :class="isHourMark(time) ? 'border-[#ebe4d7]' : 'border-transparent'"
              :style="daySlotStyle"
            ></div>

            <div
              v-for="workshop in getWorkshopsForDay(currentDateString)"
              :key="workshop.id"
              :style="getDayWorkshopStyle(workshop)"
              @click="goToWorkshop(workshop)"
              class="absolute left-2 right-2 rounded-lg p-2 transition-shadow touch-manipulation sm:p-3"
              :class="[
                isPastEvent(workshop)
                  ? 'cursor-not-allowed bg-gray-300 opacity-60'
                  : `${getWorkshopColorClass(workshop)} cursor-pointer hover:shadow-lg active:shadow-xl`
              ]"
            >
              <div
                class="mb-1 text-xs font-semibold sm:text-sm"
                :class="getWorkshopPrimaryTextClass(workshop, 'text-gray-600')"
                :style="getWorkshopPrimaryTextStyle(workshop)"
              >
                {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
              </div>
              <div
                class="mb-1 line-clamp-2 text-sm font-medium sm:text-base"
                :class="getWorkshopPrimaryTextClass(workshop, 'text-gray-700')"
                :style="getWorkshopPrimaryTextStyle(workshop)"
              >
                {{ getWorkshopCalendarName(workshop) }}
              </div>
              <div
                v-if="workshop.age_group"
                class="text-xs sm:text-sm"
                :class="getWorkshopSecondaryTextClass(workshop, 'text-gray-600')"
                :style="getWorkshopSecondaryTextStyle(workshop)"
              >
                {{ workshop.age_group }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'week' && isMobileView">
        <div v-for="day in weekDays" :key="day.date" class="border-b border-[#e5ded0] last:border-b-0">
          <div
            class="sticky top-0 border-b border-[#e5ded0] bg-[#faf8f3] px-4 py-3"
            :class="isToday(day.date) ? 'bg-[#f5ecd8]' : ''"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold" :class="isToday(day.date) ? 'text-[#d1a13b]' : 'text-stone-700'">
                  {{ day.dayName }}
                </div>
                <div class="text-xs" :class="isToday(day.date) ? 'text-[#d1a13b]' : 'text-stone-500'">
                  {{ day.dateLabel }}
                </div>
              </div>
              <div v-if="isToday(day.date)" class="rounded bg-[#edd79d] px-2 py-1 text-xs font-semibold text-[#9f7621]">
                Today
              </div>
            </div>
          </div>

          <div v-if="getWorkshopsForDay(day.date).length > 0" class="divide-y divide-gray-100">
            <div
              v-for="workshop in getWorkshopsForDay(day.date)"
              :key="workshop.id"
              @click="goToWorkshop(workshop)"
              class="p-4 transition-colors touch-manipulation"
              :class="[
                isPastEvent(workshop)
                  ? 'cursor-not-allowed bg-gray-50 opacity-60'
                  : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'
              ]"
            >
              <div class="flex items-start gap-3">
                <div
                  class="min-w-[70px] flex-shrink-0 rounded px-2 py-1 text-center text-xs font-semibold"
                  :class="isPastEvent(workshop) ? 'bg-gray-200 text-gray-600' : `${getWorkshopColorClass(workshop)} text-white`"
                  :style="getWorkshopBadgeStyle(workshop)"
                >
                  {{ formatTime(workshop.event_start_time) }}
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="mb-1 text-sm font-semibold" :class="isPastEvent(workshop) ? 'text-gray-600' : 'text-gray-900'">
                    {{ getWorkshopCalendarName(workshop) }}
                  </h3>
                  <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span v-if="workshop.event_end_time">
                      {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                    </span>
                    <span v-if="workshop.age_group" class="inline-flex items-center">
                      <span class="mx-1 h-1 w-1 rounded-full bg-gray-400"></span>
                      {{ workshop.age_group }}
                    </span>
                  </div>
                </div>

                <div v-if="!isPastEvent(workshop)" class="flex-shrink-0 text-gray-400">
                  <font-awesome-icon icon="chevron-right" class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-4 text-center text-sm text-gray-500">
            No workshops scheduled
          </div>
        </div>
      </div>

      <div v-if="workshops.length === 0" class="p-12 text-center">
        <font-awesome-icon icon="calendar" class="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h3 class="mb-2 text-xl font-semibold text-gray-900">{{ emptyTitle }}</h3>
        <p class="text-gray-600">{{ emptyText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { getWorkshopAgeLabel, getWorkshopBookingPath, isAdultWorkshopLayout } from '../../utils/workshopDisplay'

const props = defineProps({
  showViewToggle: {
    type: Boolean,
    default: true
  },
  initialViewMode: {
    type: String,
    default: 'week'
  },
  emptyTitle: {
    type: String,
    default: 'No workshops scheduled'
  },
  emptyText: {
    type: String,
    default: 'Check back soon for upcoming workshops!'
  }
})

const router = useRouter()

const workshops = ref([])
const loading = ref(true)
const error = ref(null)
const hasLoadedOnce = ref(false)
const currentDate = ref(new Date())
const viewMode = ref(props.initialViewMode === 'day' ? 'day' : 'week')
const windowWidth = ref(typeof window === 'undefined' ? 1024 : window.innerWidth)

const isMobileView = computed(() => windowWidth.value < 850)
const isInitialLoading = computed(() => loading.value && !hasLoadedOnce.value)
const showRefreshOverlay = computed(() => loading.value && hasLoadedOnce.value)
const showFullError = computed(() => Boolean(error.value) && !hasLoadedOnce.value)
const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const WEEK_SLOT_HEIGHT = 24
const DAY_SLOT_HEIGHT_MOBILE = 26
const DAY_SLOT_HEIGHT_DESKTOP = 28
const MIN_CALENDAR_EVENT_HEIGHT = 72
const MIN_EVENT_STACK_GAP = 4

const weekSlotStyle = {
  height: `${WEEK_SLOT_HEIGHT}px`
}

const daySlotStyle = computed(() => ({
  height: `${isMobileView.value ? DAY_SLOT_HEIGHT_MOBILE : DAY_SLOT_HEIGHT_DESKTOP}px`
}))

const timeSlots = [
  '9am', '9:30am', '10am', '10:30am', '11am', '11:30am',
  '12pm', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm',
  '3pm', '3:30pm', '4pm', '4:30pm', '5pm', '5:30pm', '6pm'
]

const baseWeekGridHeight = timeSlots.length * WEEK_SLOT_HEIGHT
const daySlotHeight = computed(() => (isMobileView.value ? DAY_SLOT_HEIGHT_MOBILE : DAY_SLOT_HEIGHT_DESKTOP))
const baseDayGridHeight = computed(() => timeSlots.length * daySlotHeight.value)
const weekPixelsPerMinute = WEEK_SLOT_HEIGHT / 30
const dayPixelsPerMinute = computed(() => daySlotHeight.value / 30)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

const weekDays = computed(() => {
  const start = getStartOfWeek(currentDate.value)
  const days = []

  for (let i = 0; i < 7; i += 1) {
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

const currentDateString = computed(() => currentDate.value.toISOString().split('T')[0])
const currentDayName = computed(() => currentDate.value.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))
const currentDateLabel = computed(() => currentDate.value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))

const isToday = (dateString) => {
  const today = new Date().toISOString().split('T')[0]
  return dateString === today
}

const isPastEvent = (workshop) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(workshop.event_date)
  eventDate.setHours(0, 0, 0, 0)

  if (eventDate < today) {
    return true
  }

  if (eventDate.getTime() === today.getTime() && workshop.event_start_time) {
    const now = new Date()
    const [hours, minutes] = workshop.event_start_time.split(':').map(Number)
    const eventDateTime = new Date()
    eventDateTime.setHours(hours, minutes, 0, 0)
    return eventDateTime < now
  }

  return false
}

const fetchWorkshops = async () => {
  try {
    loading.value = true
    error.value = null

    let startDate
    let endDate

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
        capacity:event_capacity(*),
        category:event_categories(
          id,
          name,
          slug,
          age_range,
          color_hex,
          icon,
          featured_image_url,
          layout_key,
          parent_id
        )
      `)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .eq('offering.status', 'published')
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })

    if (fetchError) throw fetchError

    workshops.value = (data || [])
      .filter(workshop => !isAdultWorkshopLayout(workshop))
      .map(workshop => ({
        ...workshop,
        age_group: getWorkshopAgeLabel(workshop)
      }))

    hasLoadedOnce.value = true
  } catch (err) {
    console.error('Error fetching workshops:', err)
    error.value = 'Failed to load workshops. Please try again.'
  } finally {
    loading.value = false
  }
}

const getWorkshopsForDay = (dateString) => workshops.value.filter(workshop => workshop.event_date === dateString)

const getWorkshopCalendarName = (workshop) => workshop.category?.name || workshop.offering?.title || 'Workshop'

const normalizeHexColor = (value) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!HEX_COLOR_REGEX.test(trimmed)) return null

  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  return trimmed.toLowerCase()
}

const getWorkshopCategoryColor = (workshop) => normalizeHexColor(workshop.category?.color_hex)

const hexToRgb = (hexColor) => {
  const normalized = normalizeHexColor(hexColor)
  if (!normalized) return null

  const hex = normalized.slice(1)
  const value = Number.parseInt(hex, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  }
}

const clampColorChannel = (value) => Math.min(255, Math.max(0, Math.round(value)))

const shiftHexColor = (hexColor, amount) => {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return null

  const toHex = (value) => clampColorChannel(value).toString(16).padStart(2, '0')

  return `#${toHex(rgb.r + amount)}${toHex(rgb.g + amount)}${toHex(rgb.b + amount)}`
}

const getContrastingTextColor = (hexColor) => {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return '#ffffff'

  const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000
  return yiq >= 160 ? '#1f2937' : '#ffffff'
}

const getSecondaryTextColor = (textColor) => (
  textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 24, 39, 0.82)'
)

const getWorkshopAccentStyle = (workshop) => {
  if (isPastEvent(workshop)) return {}

  const categoryColor = getWorkshopCategoryColor(workshop)
  if (!categoryColor) return {}

  return {
    backgroundColor: categoryColor,
    borderColor: shiftHexColor(categoryColor, -24) || categoryColor,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: getContrastingTextColor(categoryColor)
  }
}

const getWorkshopColorClass = (workshop) => {
  if (getWorkshopCategoryColor(workshop)) return ''

  const title = workshop.offering.title.toLowerCase()
  const categorySlug = workshop.category?.slug?.toLowerCase() || ''

  if (isAdultWorkshopLayout(workshop) || categorySlug.includes('adult')) return 'bg-rose-700 hover:bg-rose-800'
  if (title.includes('open studio')) return 'bg-blue-500 hover:bg-blue-600'
  if (title.includes('storytelling') || title.includes('storytime')) return 'bg-orange-500 hover:bg-orange-600'
  if (title.includes('little ones') || title.includes('ages 2-4')) return 'bg-amber-700 hover:bg-amber-800'
  if (title.includes('private') || title.includes('party')) return 'bg-yellow-500 hover:bg-yellow-600'
  if (title.includes('creative saturdays')) return 'bg-orange-500 hover:bg-orange-600'
  return 'bg-primary-600 hover:bg-primary-700'
}

const getWorkshopPrimaryTextClass = (workshop, pastClass = 'text-gray-700') => {
  if (isPastEvent(workshop)) return pastClass
  return getWorkshopCategoryColor(workshop) ? '' : 'text-white'
}

const getWorkshopPrimaryTextStyle = (workshop) => {
  if (isPastEvent(workshop)) return {}

  const categoryColor = getWorkshopCategoryColor(workshop)
  if (!categoryColor) return {}

  return {
    color: getContrastingTextColor(categoryColor)
  }
}

const getWorkshopSecondaryTextClass = (workshop, pastClass = 'text-gray-600') => {
  if (isPastEvent(workshop)) return pastClass
  return getWorkshopCategoryColor(workshop) ? '' : 'text-white/90'
}

const getWorkshopSecondaryTextStyle = (workshop) => {
  if (isPastEvent(workshop)) return {}

  const categoryColor = getWorkshopCategoryColor(workshop)
  if (!categoryColor) return {}

  return {
    color: getSecondaryTextColor(getContrastingTextColor(categoryColor))
  }
}

const getWorkshopBadgeStyle = (workshop) => getWorkshopAccentStyle(workshop)

const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

const isHourMark = (timeLabel) => !timeLabel.includes(':30')

const getWorkshopDurationMinutes = (workshop) => {
  const startMinutes = timeToMinutes(workshop.event_start_time)
  const endMinutes = timeToMinutes(workshop.event_end_time || workshop.event_start_time)
  return Math.max(endMinutes - startMinutes, 0)
}

const shouldShowWorkshopAgeInGrid = (workshop) => getWorkshopDurationMinutes(workshop) >= 90

const getWorkshopTimeRange = (workshop) => {
  const startMinutes = timeToMinutes(workshop.event_start_time) - (9 * 60)
  const endMinutes = timeToMinutes(workshop.event_end_time || workshop.event_start_time) - (9 * 60)

  return {
    startMinutes,
    durationMinutes: Math.max(endMinutes - startMinutes, 0)
  }
}

const buildDayWorkshopLayout = (dayWorkshops, pixelsPerMinute) => {
  const positions = {}
  let previousBottom = null
  let maxBottom = 0

  for (const workshop of dayWorkshops) {
    const { startMinutes, durationMinutes } = getWorkshopTimeRange(workshop)
    const desiredTop = startMinutes * pixelsPerMinute
    const height = Math.max(durationMinutes * pixelsPerMinute, MIN_CALENDAR_EVENT_HEIGHT)
    const top = previousBottom === null
      ? desiredTop
      : Math.max(desiredTop, previousBottom + MIN_EVENT_STACK_GAP)

    positions[workshop.id] = { top, height }
    previousBottom = top + height
    maxBottom = Math.max(maxBottom, previousBottom)
  }

  return {
    positions,
    maxBottom
  }
}

const weekWorkshopLayout = computed(() => {
  const positionsByDay = {}
  let gridHeight = baseWeekGridHeight

  for (const day of weekDays.value) {
    const layout = buildDayWorkshopLayout(getWorkshopsForDay(day.date), weekPixelsPerMinute)
    positionsByDay[day.date] = layout.positions
    gridHeight = Math.max(gridHeight, layout.maxBottom)
  }

  return {
    positionsByDay,
    gridHeight
  }
})

const currentDayWorkshopLayout = computed(() => buildDayWorkshopLayout(
  getWorkshopsForDay(currentDateString.value),
  dayPixelsPerMinute.value
))

const weekGridColumnStyle = computed(() => ({
  height: `${weekWorkshopLayout.value.gridHeight}px`
}))

const dayGridColumnStyle = computed(() => ({
  height: `${Math.max(baseDayGridHeight.value, currentDayWorkshopLayout.value.maxBottom)}px`
}))

const getWeekWorkshopStyle = (dateString, workshop) => {
  const position = weekWorkshopLayout.value.positionsByDay[dateString]?.[workshop.id]
  if (!position) return getWorkshopAccentStyle(workshop)

  return {
    ...getWorkshopAccentStyle(workshop),
    top: `${position.top}px`,
    height: `${position.height}px`
  }
}

const getDayWorkshopStyle = (workshop) => {
  const position = currentDayWorkshopLayout.value.positions[workshop.id]
  if (!position) return getWorkshopAccentStyle(workshop)

  return {
    ...getWorkshopAccentStyle(workshop),
    top: `${position.top}px`,
    height: `${position.height}px`
  }
}

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':')
  const hour = Number.parseInt(hours, 10)
  const period = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${displayHour}:${minutes}${period}`
}

const formatTimeRange = (startTime, endTime) => {
  if (!endTime) return formatTime(startTime)
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

const previousPeriod = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - (viewMode.value === 'day' ? 1 : 7))
  currentDate.value = newDate
}

const nextPeriod = () => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + (viewMode.value === 'day' ? 1 : 7))
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const goToWorkshop = (workshop) => {
  if (isPastEvent(workshop)) return
  router.push(getWorkshopBookingPath(workshop))
}

watch([currentDate, viewMode], () => {
  fetchWorkshops()
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
