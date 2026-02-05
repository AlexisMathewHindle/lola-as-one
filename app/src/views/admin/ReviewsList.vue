<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Reviews</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage customer reviews and ratings
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Rating Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <select
            v-model="filters.rating"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <!-- Verified Purchase Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Purchase</label>
          <select
            v-model="filters.verified"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Reviews</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Customer or product..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredReviews.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="star" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
      <p class="text-gray-600">
        {{ filters.status || filters.rating || filters.search ? 'Try adjusting your filters' : 'Reviews will appear here once customers submit them' }}
      </p>
    </div>

    <!-- Reviews Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Review
              </th>
              <th class="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="review in filteredReviews" :key="review.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 sm:px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ review.offering_product?.offering?.title || 'Unknown Product' }}</div>
                <div class="text-xs text-gray-500">{{ review.offering_product?.sku || 'N/A' }}</div>
                <div class="md:hidden text-xs text-gray-500 mt-1">
                  {{ review.customer_name }}
                </div>
              </td>
              <td class="hidden md:table-cell px-4 sm:px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ review.customer_name }}</div>
                <div class="text-xs text-gray-500">{{ review.customer_email || 'No email' }}</div>
                <div v-if="review.is_verified_purchase" class="text-xs text-success-600 mt-1">
                  <font-awesome-icon icon="check-circle" class="mr-1" />
                  Verified Purchase
                </div>
              </td>
              <td class="px-4 sm:px-6 py-4">
                <div class="flex items-center">
                  <span class="text-sm font-medium text-gray-900 mr-1">{{ review.rating }}</span>
                  <font-awesome-icon icon="star" class="w-4 h-4 text-warning-500" />
                </div>
                <div class="lg:hidden text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ review.review_text || 'No review text' }}
                </div>
              </td>
              <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                <div class="text-sm text-gray-900 line-clamp-2">{{ review.review_text || 'No review text' }}</div>
              </td>
              <td class="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                {{ formatDate(review.created_at) }}
              </td>
              <td class="px-4 sm:px-6 py-4">
                <span
                  class="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(review.is_approved)"
                >
                  {{ review.is_approved ? 'Approved' : 'Pending' }}
                </span>
              </td>
              <td class="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                <button
                  v-if="!review.is_approved"
                  @click="approveReview(review.id)"
                  class="text-success-600 hover:text-success-800 mr-2 sm:mr-3"
                  title="Approve"
                >
                  <font-awesome-icon icon="check" />
                </button>
                <button
                  @click="deleteReview(review.id)"
                  class="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const reviews = ref([])
const toastStore = useToastStore()
const loading = ref(true)
const error = ref(null)

const filters = ref({
  status: '',
  rating: '',
  verified: '',
  search: ''
})

// Fetch all reviews
const fetchReviews = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('product_reviews')
      .select(`
        *,
        offering_product:offering_products(
          id,
          sku,
          offering:offerings(title)
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    reviews.value = data || []
  } catch (err) {
    console.error('Error fetching reviews:', err)
    error.value = 'Failed to load reviews. Please try again.'
  } finally {
    loading.value = false
  }
}

// Filtered reviews
const filteredReviews = computed(() => {
  return reviews.value.filter(review => {
    // Status filter
    if (filters.value.status === 'approved' && !review.is_approved) return false
    if (filters.value.status === 'pending' && review.is_approved) return false
    if (filters.value.status === 'rejected' && review.is_approved !== false) return false

    // Rating filter
    if (filters.value.rating && review.rating !== parseInt(filters.value.rating)) {
      return false
    }

    // Verified purchase filter
    if (filters.value.verified === 'true' && !review.is_verified_purchase) return false
    if (filters.value.verified === 'false' && review.is_verified_purchase) return false

    // Search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      return (
        review.customer_name?.toLowerCase().includes(searchLower) ||
        review.customer_email?.toLowerCase().includes(searchLower) ||
        review.offering_product?.offering?.title?.toLowerCase().includes(searchLower) ||
        review.review_text?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })
})

// Approve review
const approveReview = async (reviewId) => {
  try {
    const { error: updateError } = await supabase
      .from('product_reviews')
      .update({ is_approved: true })
      .eq('id', reviewId)

    if (updateError) throw updateError

    // Update local state
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) review.is_approved = true
  } catch (err) {
    console.error('Error approving review:', err)
    toastStore.error('Failed to approve review. Please try again.')
  }
}

// Delete review
const deleteReview = async (reviewId) => {
  if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
    return
  }

  try {
    const { error: deleteError } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) throw deleteError

    // Remove from local state
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
  } catch (err) {
    console.error('Error deleting review:', err)
    toastStore.error('Failed to delete review. Please try again.')
  }
}

// Status badge classes
const getStatusClass = (isApproved) => {
  return isApproved
    ? 'bg-success-100 text-success-800'
    : 'bg-warning-100 text-warning-800'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchReviews()
})
</script>