<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Blog Posts</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage blog posts and articles
        </p>
      </div>
      <router-link
        to="/admin/blog/new"
        class="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
      >
        <font-awesome-icon icon="plus" class="w-4 h-4 mr-2" />
        Create Blog Post
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <font-awesome-icon icon="filter" class="w-4 h-4 text-gray-500 mr-2" />
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div class="relative">
            <font-awesome-icon icon="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search by title or content..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Posts Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
        <p class="text-gray-500">Loading blog posts...</p>
      </div>

      <div v-else-if="filteredPosts.length === 0" class="text-center py-16">
        <font-awesome-icon icon="newspaper" class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-lg font-medium text-gray-900 mb-2">No blog posts found</p>
        <p class="text-sm text-gray-500">Try adjusting your filters or create a new blog post</p>
      </div>

      <!-- Desktop Table View -->
      <div v-else class="overflow-x-auto">
        <table class="hidden lg:table min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Featured Image
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Author
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Published Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="post in filteredPosts" :key="post.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    v-if="post.featured_image_url"
                    :src="post.featured_image_url"
                    :alt="post.title"
                    class="w-full h-full object-cover"
                  />
                  <font-awesome-icon v-else icon="image" class="w-6 h-6 text-gray-300" />
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-semibold text-gray-900">{{ post.title }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ post.slug }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ post.author_name || 'No author' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ formatDate(post.published_at) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(post.status)"
                >
                  {{ post.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-3">
                  <router-link
                    :to="`/admin/blog/${post.id}/edit`"
                    class="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <font-awesome-icon icon="edit" class="w-4 h-4" />
                  </router-link>
                  <button
                    @click="deletePost(post)"
                    class="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <font-awesome-icon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Card View -->
        <div class="lg:hidden divide-y divide-gray-200">
          <div
            v-for="post in filteredPosts"
            :key="post.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="post.featured_image_url"
                    :src="post.featured_image_url"
                    :alt="post.title"
                    class="w-full h-full object-cover"
                  />
                  <font-awesome-icon v-else icon="image" class="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">{{ post.title }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ post.slug }}</p>
                </div>
              </div>
              <span
                class="px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0"
                :class="getStatusClass(post.status)"
              >
                {{ post.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span class="text-gray-500">Author:</span>
                <span class="ml-1 text-gray-900">{{ post.author_name || 'No author' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Published:</span>
                <span class="ml-1 text-gray-600">{{ formatDate(post.published_at) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-3 pt-3 border-t border-gray-100">
              <router-link
                :to="`/admin/blog/${post.id}/edit`"
                class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                <font-awesome-icon icon="edit" class="w-4 h-4 mr-2" />
                Edit
              </router-link>
              <button
                @click="deletePost(post)"
                class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <font-awesome-icon icon="trash" class="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()
const posts = ref([])
const loading = ref(true)

const filters = ref({
  status: '',
  search: ''
})

const fetchPosts = async () => {
  try {
    loading.value = true

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    posts.value = data || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  } finally {
    loading.value = false
  }
}

const filteredPosts = computed(() => {
  let result = posts.value

  // Filter by status
  if (filters.value.status) {
    result = result.filter(post => post.status === filters.value.status)
  }

  // Filter by search
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    result = result.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.excerpt?.toLowerCase().includes(searchLower) ||
      post.slug.toLowerCase().includes(searchLower)
    )
  }

  return result
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.status || filters.value.search)
})

// Clear all filters
const clearFilters = () => {
  filters.value.status = ''
  filters.value.search = ''
}

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-success-100 text-success-800',
    archived: 'bg-warning-100 text-warning-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not published'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const deletePost = async (post) => {
  if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
    return
  }

  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', post.id)

    if (error) throw error

    // Remove from local array
    posts.value = posts.value.filter(p => p.id !== post.id)
  } catch (error) {
    console.error('Error deleting blog post:', error)
    toastStore.error('Failed to delete blog post. Please try again.')
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

