<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Coupons</h1>
        <p class="mt-1 text-sm text-gray-600">
          Create and manage checkout discounts.
        </p>
      </div>

      <button
        type="button"
        @click="startCreate"
        class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
        New Coupon
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <section class="space-y-4">
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
                  placeholder="Code or name"
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
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <font-awesome-icon
                  icon="chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div v-if="loading" class="px-6 py-16 text-center">
            <font-awesome-icon icon="spinner" class="h-8 w-8 animate-spin text-primary-600" />
            <p class="mt-4 text-sm text-gray-600">Loading coupons...</p>
          </div>

          <div v-else-if="filteredCoupons.length === 0" class="px-6 py-16 text-center">
            <font-awesome-icon icon="tags" class="h-12 w-12 text-gray-300" />
            <h3 class="mt-4 text-lg font-semibold text-gray-900">No coupons found</h3>
            <p class="mt-1 text-sm text-gray-600">
              {{ coupons.length ? 'Try changing the filters.' : 'Create a coupon to make it available at checkout.' }}
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="hidden min-w-full divide-y divide-gray-200 xl:table">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Coupon
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Discount
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Scope
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Usage
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                  <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="coupon in filteredCoupons"
                  :key="coupon.id"
                  class="transition-colors hover:bg-gray-50"
                >
                  <td class="px-6 py-4">
                    <div class="font-mono text-sm font-semibold text-gray-900">{{ coupon.code }}</div>
                    <div class="mt-1 text-sm text-gray-600">{{ coupon.name || 'No name' }}</div>
                    <div v-if="coupon.valid_until" class="mt-1 text-xs text-gray-500">
                      Ends {{ formatDate(coupon.valid_until) }}
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {{ formatDiscount(coupon) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {{ formatScope(coupon.applies_to) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {{ usageLabel(coupon) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="statusBadgeClass(coupon)"
                    >
                      {{ statusLabel(coupon) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-3">
                      <button
                        type="button"
                        class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                        @click="toggleActive(coupon)"
                      >
                        {{ coupon.is_active ? 'Disable' : 'Enable' }}
                      </button>
                      <button
                        type="button"
                        class="text-primary-600 transition-colors hover:text-primary-800"
                        title="Edit"
                        @click="startEdit(coupon)"
                      >
                        <font-awesome-icon icon="edit" class="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        class="text-red-600 transition-colors hover:text-red-800"
                        title="Delete"
                        @click="deleteCoupon(coupon)"
                      >
                        <font-awesome-icon icon="trash" class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="divide-y divide-gray-200 xl:hidden">
              <article
                v-for="coupon in filteredCoupons"
                :key="coupon.id"
                class="space-y-4 p-4"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="font-mono text-sm font-semibold text-gray-900">{{ coupon.code }}</div>
                    <div class="mt-1 text-sm text-gray-600">{{ coupon.name || 'No name' }}</div>
                  </div>
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="statusBadgeClass(coupon)"
                  >
                    {{ statusLabel(coupon) }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-gray-500">Discount:</span>
                    <span class="ml-1 font-medium text-gray-900">{{ formatDiscount(coupon) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Usage:</span>
                    <span class="ml-1 font-medium text-gray-900">{{ usageLabel(coupon) }}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-500">Scope:</span>
                    <span class="ml-1 font-medium text-gray-900">{{ formatScope(coupon.applies_to) }}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                    @click="toggleActive(coupon)"
                  >
                    {{ coupon.is_active ? 'Disable' : 'Enable' }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center rounded-lg border border-primary-300 px-3 py-2 text-sm font-medium text-primary-700"
                    @click="startEdit(coupon)"
                  >
                    <font-awesome-icon icon="edit" class="mr-2 h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center rounded-lg border border-danger-300 px-3 py-2 text-sm font-medium text-danger-700"
                    @click="deleteCoupon(coupon)"
                  >
                    <font-awesome-icon icon="trash" class="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start">
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Edit Coupon' : 'Add Coupon' }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            Codes are normalized to uppercase.
          </p>
        </div>

        <form class="space-y-5 px-6 py-6" @submit.prevent="saveCoupon">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Code</label>
            <input
              v-model="form.code"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono uppercase focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="SUMMER25"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Summer offer"
            >
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Type</label>
              <div class="relative">
                <select
                  v-model="form.discountType"
                  class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed GBP</option>
                </select>
                <font-awesome-icon
                  icon="chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                {{ form.discountType === 'percentage' ? 'Percent Off' : 'Amount Off' }}
              </label>
              <input
                v-model="form.discountValue"
                type="number"
                min="0.01"
                :max="form.discountType === 'percentage' ? 100 : undefined"
                step="0.01"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Applies To</label>
            <div class="relative">
              <select
                v-model="form.appliesTo"
                class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All checkout items</option>
                <option value="events">Workshops only</option>
                <option value="products">Products only</option>
                <option value="subscriptions">Subscriptions only</option>
              </select>
              <font-awesome-icon
                icon="chevron-down"
                class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Starts</label>
              <input
                v-model="form.validFrom"
                type="datetime-local"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Ends</label>
              <input
                v-model="form.validUntil"
                type="datetime-local"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Total Limit</label>
              <input
                v-model="form.usageLimit"
                type="number"
                min="1"
                step="1"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Unlimited"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Per Customer</label>
              <input
                v-model="form.perCustomerLimit"
                type="number"
                min="1"
                step="1"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Unlimited"
              >
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Internal notes"
            ></textarea>
          </div>

          <label class="flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Active
          </label>

          <div
            v-if="formError"
            class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {{ formError }}
          </div>

          <div class="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <font-awesome-icon
                :icon="saving ? 'spinner' : 'save'"
                class="mr-2 h-4 w-4"
                :class="{ 'animate-spin': saving }"
              />
              {{ saving ? 'Saving...' : (isEditing ? 'Update Coupon' : 'Create Coupon') }}
            </button>

            <button
              type="button"
              :disabled="saving"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="resetForm"
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const coupons = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const formError = ref('')

const filters = ref({
  search: '',
  status: '',
})

const defaultForm = () => ({
  id: null,
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  isActive: true,
  validFrom: '',
  validUntil: '',
  usageLimit: '',
  perCustomerLimit: '',
  appliesTo: 'all',
})

const form = ref(defaultForm())

const isEditing = computed(() => Boolean(form.value.id))

const filteredCoupons = computed(() => {
  const search = filters.value.search.trim().toLowerCase()

  return coupons.value.filter((coupon) => {
    if (search) {
      const haystack = `${coupon.code || ''} ${coupon.name || ''} ${coupon.description || ''}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }

    if (filters.value.status) {
      if (filters.value.status !== getCouponStatus(coupon)) return false
    }

    return true
  })
})

const fetchCoupons = async () => {
  try {
    loading.value = true
    error.value = ''

    const { data, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    coupons.value = data || []
  } catch (err) {
    console.error('Error loading coupons:', err)
    error.value = 'Failed to load coupons. Please try again.'
  } finally {
    loading.value = false
  }
}

const startCreate = () => {
  resetForm()
}

const startEdit = (coupon) => {
  formError.value = ''
  form.value = {
    id: coupon.id,
    code: coupon.code || '',
    name: coupon.name || '',
    description: coupon.description || '',
    discountType: coupon.discount_type || 'percentage',
    discountValue: Number(coupon.discount_value || 0),
    isActive: Boolean(coupon.is_active),
    validFrom: formatDateTimeLocal(coupon.valid_from),
    validUntil: formatDateTimeLocal(coupon.valid_until),
    usageLimit: coupon.usage_limit || '',
    perCustomerLimit: coupon.per_customer_limit || '',
    appliesTo: coupon.applies_to || 'all',
  }
}

const resetForm = () => {
  form.value = defaultForm()
  formError.value = ''
}

const saveCoupon = async () => {
  formError.value = ''

  const validationError = validateForm()
  if (validationError) {
    formError.value = validationError
    return
  }

  try {
    saving.value = true

    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim() || null,
      description: form.value.description.trim() || null,
      discount_type: form.value.discountType,
      discount_value: Number(form.value.discountValue),
      is_active: form.value.isActive,
      valid_from: toIsoTimestamp(form.value.validFrom),
      valid_until: toIsoTimestamp(form.value.validUntil),
      usage_limit: toNullableInteger(form.value.usageLimit),
      per_customer_limit: toNullableInteger(form.value.perCustomerLimit),
      applies_to: form.value.appliesTo,
      updated_by: user?.id || null,
    }

    if (isEditing.value) {
      const { error: updateError } = await supabase
        .from('coupons')
        .update(payload)
        .eq('id', form.value.id)

      if (updateError) throw updateError
      toastStore.success('Coupon updated')
    } else {
      const { error: insertError } = await supabase
        .from('coupons')
        .insert({
          ...payload,
          created_by: user?.id || null,
        })

      if (insertError) throw insertError
      toastStore.success('Coupon created')
    }

    resetForm()
    await fetchCoupons()
  } catch (err) {
    console.error('Error saving coupon:', err)
    formError.value = err.message?.includes('duplicate')
      ? 'A coupon with this code already exists.'
      : 'Failed to save coupon. Please try again.'
  } finally {
    saving.value = false
  }
}

const toggleActive = async (coupon) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error: updateError } = await supabase
      .from('coupons')
      .update({
        is_active: !coupon.is_active,
        updated_by: user?.id || null,
      })
      .eq('id', coupon.id)

    if (updateError) throw updateError

    coupon.is_active = !coupon.is_active
    toastStore.success(coupon.is_active ? 'Coupon enabled' : 'Coupon disabled')
  } catch (err) {
    console.error('Error toggling coupon:', err)
    toastStore.error('Failed to update coupon. Please try again.')
  }
}

const deleteCoupon = async (coupon) => {
  if (!confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) {
    return
  }

  try {
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', coupon.id)

    if (deleteError) throw deleteError

    coupons.value = coupons.value.filter((item) => item.id !== coupon.id)
    if (form.value.id === coupon.id) resetForm()
    toastStore.success('Coupon deleted')
  } catch (err) {
    console.error('Error deleting coupon:', err)
    toastStore.error('Failed to delete coupon. Please try again.')
  }
}

const validateForm = () => {
  const code = form.value.code.trim()
  const discountValue = Number(form.value.discountValue)

  if (!code) return 'Coupon code is required.'
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return 'Coupon code can only contain letters, numbers, dashes, and underscores.'
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 'Discount value must be greater than zero.'
  if (form.value.discountType === 'percentage' && discountValue > 100) return 'Percentage discounts cannot exceed 100%.'

  const validFrom = form.value.validFrom ? new Date(form.value.validFrom) : null
  const validUntil = form.value.validUntil ? new Date(form.value.validUntil) : null

  if (validFrom && Number.isNaN(validFrom.getTime())) return 'Start date is invalid.'
  if (validUntil && Number.isNaN(validUntil.getTime())) return 'End date is invalid.'
  if (validFrom && validUntil && validUntil <= validFrom) return 'End date must be after the start date.'

  return ''
}

const toNullableInteger = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const toIsoTimestamp = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const formatDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const formatDate = (value) => {
  if (!value) return 'No end date'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDiscount = (coupon) => {
  const value = Number(coupon.discount_value || 0)
  if (coupon.discount_type === 'percentage') return `${value.toFixed(value % 1 ? 2 : 0)}%`
  return `£${value.toFixed(2)}`
}

const formatScope = (scope) => {
  const labels = {
    all: 'All items',
    events: 'Workshops',
    products: 'Products',
    subscriptions: 'Subscriptions',
  }
  return labels[scope] || 'All items'
}

const usageLabel = (coupon) => {
  const used = Number(coupon.usage_count || 0)
  return coupon.usage_limit ? `${used} / ${coupon.usage_limit}` : `${used} used`
}

const getCouponStatus = (coupon) => {
  if (!coupon.is_active) return 'inactive'

  const now = Date.now()
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) return 'scheduled'
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) return 'expired'
  if (coupon.usage_limit && Number(coupon.usage_count || 0) >= Number(coupon.usage_limit)) return 'inactive'

  return 'active'
}

const statusLabel = (coupon) => {
  const status = getCouponStatus(coupon)
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    scheduled: 'Scheduled',
  }
  return labels[status] || 'Inactive'
}

const statusBadgeClass = (coupon) => {
  const status = getCouponStatus(coupon)
  if (status === 'active') return 'bg-success-100 text-success-800'
  if (status === 'scheduled') return 'bg-primary-100 text-primary-800'
  if (status === 'expired') return 'bg-warning-100 text-warning-800'
  return 'bg-gray-100 text-gray-700'
}

onMounted(fetchCoupons)
</script>
