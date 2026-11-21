<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Gift Cards</h1>
        <p class="mt-1 text-sm text-gray-600">
          View issued gift cards, check balances, extend expiry, void a card, or resend the gift email.
        </p>
      </div>
      <button
        type="button"
        @click="fetchGiftCards"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <font-awesome-icon icon="spinner" v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        Refresh
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <!-- Filters -->
    <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">Search</label>
          <div class="relative">
            <font-awesome-icon
              icon="search"
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="filters.search"
              type="text"
              class="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Code, purchaser or recipient email"
            >
          </div>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">Status</label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="used_up">Used up</option>
              <option value="expired">Expired</option>
              <option value="void">Void</option>
            </select>
            <font-awesome-icon
              icon="chevron-down"
              class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div v-if="loading" class="px-6 py-16 text-center">
        <font-awesome-icon icon="spinner" class="h-8 w-8 animate-spin text-primary-600" />
        <p class="mt-4 text-sm text-gray-600">Loading gift cards...</p>
      </div>

      <div v-else-if="filteredCards.length === 0" class="px-6 py-16 text-center">
        <font-awesome-icon icon="heart" class="h-12 w-12 text-gray-300" />
        <h3 class="mt-4 text-lg font-semibold text-gray-900">No gift cards found</h3>
        <p class="mt-1 text-sm text-gray-600">
          {{ cards.length ? 'Try changing the filters.' : 'Gift cards appear here once customers buy them.' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Code</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Balance</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Recipient / Buyer</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Expiry</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="card in filteredCards" :key="card.id" class="transition-colors hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="font-mono text-sm font-semibold text-gray-900">{{ card.code }}</div>
                <div class="mt-1 text-xs text-gray-500">Bought {{ formatDate(card.created_at) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-semibold text-gray-900">£{{ toMoney(card.remaining_balance_gbp) }}</div>
                <div class="mt-1 text-xs text-gray-500">of £{{ toMoney(card.initial_amount_gbp) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ card.recipient_email || card.purchaser_email || '—' }}</div>
                <div v-if="card.recipient_email && card.purchaser_email" class="mt-1 text-xs text-gray-500">
                  from {{ card.purchaser_email }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(card.expires_at) }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusBadgeClass(card)"
                >
                  {{ statusLabel(card) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  @click="openCard(card)"
                  class="text-sm font-medium text-primary-600 hover:text-primary-800"
                >
                  Manage
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manage modal -->
    <div
      v-if="selectedCard"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeCard"
    >
      <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <div class="font-mono text-lg font-semibold text-gray-900">{{ selectedCard.code }}</div>
            <span
              class="mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusBadgeClass(selectedCard)"
            >
              {{ statusLabel(selectedCard) }}
            </span>
          </div>
          <button type="button" @click="closeCard" class="text-gray-400 hover:text-gray-600">
            <font-awesome-icon icon="times" class="h-5 w-5" />
          </button>
        </div>

        <div class="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <!-- Summary -->
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-gray-500">Balance</dt>
              <dd class="font-semibold text-gray-900">£{{ toMoney(selectedCard.remaining_balance_gbp) }} of £{{ toMoney(selectedCard.initial_amount_gbp) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Expiry</dt>
              <dd class="font-semibold text-gray-900">{{ formatDate(selectedCard.expires_at) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Buyer</dt>
              <dd class="text-gray-900">{{ selectedCard.purchaser_email || '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Recipient</dt>
              <dd class="text-gray-900">{{ selectedCard.recipient_email || '—' }}</dd>
            </div>
          </dl>

          <div v-if="selectedCard.personal_message" class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <div class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Message</div>
            {{ selectedCard.personal_message }}
          </div>

          <!-- Redemption history -->
          <div>
            <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Spending history</div>
            <div v-if="loadingHistory" class="text-sm text-gray-500">Loading...</div>
            <div v-else-if="redemptions.length === 0" class="text-sm text-gray-500">Not spent yet.</div>
            <ul v-else class="divide-y divide-gray-100 text-sm">
              <li v-for="r in redemptions" :key="r.id" class="flex justify-between py-2">
                <span class="text-gray-600">{{ formatDate(r.redeemed_at) }}</span>
                <span class="font-medium text-gray-900">−£{{ toMoney(r.amount_redeemed_gbp) }}</span>
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Change expiry date</label>
              <div class="flex gap-2">
                <input
                  v-model="expiryInput"
                  type="date"
                  class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <button
                  type="button"
                  :disabled="actionBusy"
                  @click="saveExpiry"
                  class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                :disabled="actionBusy || !(selectedCard.recipient_email || selectedCard.purchaser_email)"
                @click="resendEmail"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Resend gift email
              </button>
              <button
                v-if="selectedCard.status !== 'void'"
                type="button"
                :disabled="actionBusy"
                @click="voidCard"
                class="rounded-lg border border-danger-300 bg-white px-4 py-2 text-sm font-medium text-danger-700 hover:bg-danger-50 disabled:opacity-50"
              >
                Void this card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const cards = ref([])
const loading = ref(false)
const error = ref('')
const filters = ref({ search: '', status: '' })

const selectedCard = ref(null)
const redemptions = ref([])
const loadingHistory = ref(false)
const expiryInput = ref('')
const actionBusy = ref(false)

const toMoney = (value) => Number(value || 0).toFixed(2)

const formatDate = (value) => {
  if (!value) return 'No expiry'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Derived status: a card marked active but past its expiry reads as "expired".
const derivedStatus = (card) => {
  if (card.status === 'void') return 'void'
  if (card.status === 'used_up') return 'used_up'
  if (card.expires_at && new Date(card.expires_at).getTime() < Date.now()) return 'expired'
  return 'active'
}

const statusLabel = (card) => {
  const labels = { active: 'Active', used_up: 'Used up', expired: 'Expired', void: 'Void' }
  return labels[derivedStatus(card)] || 'Active'
}

const statusBadgeClass = (card) => {
  const status = derivedStatus(card)
  if (status === 'active') return 'bg-success-100 text-success-800'
  if (status === 'used_up') return 'bg-gray-100 text-gray-700'
  if (status === 'expired') return 'bg-warning-100 text-warning-800'
  return 'bg-danger-100 text-danger-700'
}

const filteredCards = computed(() => {
  return cards.value.filter((card) => {
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      const haystack = `${card.code || ''} ${card.purchaser_email || ''} ${card.recipient_email || ''}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.value.status && filters.value.status !== derivedStatus(card)) return false
    return true
  })
})

const fetchGiftCards = async () => {
  try {
    loading.value = true
    error.value = ''
    const { data, error: fetchError } = await supabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false })
    if (fetchError) throw fetchError
    cards.value = data || []
  } catch (err) {
    console.error('Error loading gift cards:', err)
    error.value = 'Failed to load gift cards. Please try again.'
  } finally {
    loading.value = false
  }
}

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const openCard = async (card) => {
  selectedCard.value = card
  expiryInput.value = toDateInput(card.expires_at)
  redemptions.value = []
  loadingHistory.value = true
  try {
    const { data, error: histError } = await supabase
      .from('gift_card_redemptions')
      .select('id, amount_redeemed_gbp, redeemed_at')
      .eq('gift_card_id', card.id)
      .order('redeemed_at', { ascending: false })
    if (histError) throw histError
    redemptions.value = data || []
  } catch (err) {
    console.error('Error loading redemptions:', err)
    toastStore.error('Could not load spending history.')
  } finally {
    loadingHistory.value = false
  }
}

const closeCard = () => {
  selectedCard.value = null
  redemptions.value = []
}

const applyCardUpdate = (updated) => {
  const index = cards.value.findIndex((c) => c.id === updated.id)
  if (index !== -1) cards.value[index] = { ...cards.value[index], ...updated }
  if (selectedCard.value?.id === updated.id) {
    selectedCard.value = { ...selectedCard.value, ...updated }
  }
}

const saveExpiry = async () => {
  if (!selectedCard.value || !expiryInput.value) {
    toastStore.error('Please pick a date.')
    return
  }
  try {
    actionBusy.value = true
    const isoExpiry = new Date(`${expiryInput.value}T23:59:59`).toISOString()
    const { data, error: updateError } = await supabase
      .from('gift_cards')
      .update({ expires_at: isoExpiry })
      .eq('id', selectedCard.value.id)
      .select()
      .single()
    if (updateError) throw updateError
    applyCardUpdate(data)
    toastStore.success('Expiry updated.')
  } catch (err) {
    console.error('Error updating expiry:', err)
    toastStore.error('Could not update expiry. Please try again.')
  } finally {
    actionBusy.value = false
  }
}

const voidCard = async () => {
  if (!selectedCard.value) return
  try {
    actionBusy.value = true
    const { data, error: updateError } = await supabase
      .from('gift_cards')
      .update({ status: 'void' })
      .eq('id', selectedCard.value.id)
      .select()
      .single()
    if (updateError) throw updateError
    applyCardUpdate(data)
    toastStore.success('Gift card voided.')
  } catch (err) {
    console.error('Error voiding gift card:', err)
    toastStore.error('Could not void the card. Please try again.')
  } finally {
    actionBusy.value = false
  }
}

const resendEmail = async () => {
  if (!selectedCard.value) return
  const to = selectedCard.value.recipient_email || selectedCard.value.purchaser_email
  if (!to) {
    toastStore.error('No email address on this card to send to.')
    return
  }
  try {
    actionBusy.value = true
    const shopUrl = `${window.location.origin}/shop`
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'gift-card-received',
        to,
        data: {
          recipientName: selectedCard.value.recipient_name || 'there',
          senderName: 'Lots of Lovely Art',
          giftCardCode: selectedCard.value.code,
          amount: Number(selectedCard.value.remaining_balance_gbp || 0),
          personalMessage: selectedCard.value.personal_message || undefined,
          redemptionLink: shopUrl,
        },
        metadata: { giftCardCode: selectedCard.value.code, resend: true },
      },
    })
    if (sendError) throw sendError
    toastStore.success(`Gift email resent to ${to}.`)
  } catch (err) {
    console.error('Error resending gift email:', err)
    toastStore.error('Could not resend the gift email. Please try again.')
  } finally {
    actionBusy.value = false
  }
}

onMounted(fetchGiftCards)
</script>
